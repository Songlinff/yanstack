/**
 * 超大网盘资料：自动分类助手（不移动原文件，只生成整理方案）
 *
 * 用法：
 *   1) 把网盘同步/导出的目录树文本放到 input/filelist.txt
 *      或对本机已同步目录：
 *      npx tsx scripts/organize-netdisk.ts --scan "D:\百度网盘\考研资料"
 *   2) 查看 output/ 下的分类结果与上架候选
 *
 * 原则：6TB 原盘保持不动；只生成「搬家建议 + 网站上架清单」
 */
import fs from "fs";
import path from "path";

type Hit = {
  raw: string;
  name: string;
  category: string;
  year: number | null;
  score: number;
  reasons: string[];
};

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "output");
const INPUT = path.join(ROOT, "input", "filelist.txt");

const RULES: Array<{ category: string; patterns: RegExp[]; weight: number }> = [
  { category: "政治", patterns: [/政治/, /马原/, /毛中特/, /史纲/, /思修/, /时政/, /徐涛/, /肖秀荣/, /腿姐/], weight: 10 },
  { category: "英语", patterns: [/英语/, /英一/, /英二/, /考研英语/, /长难句/, /作文模板/, /阅读理解/, /唐迟/, /刘晓艳/], weight: 10 },
  { category: "数学", patterns: [/数学/, /数一/, /数二/, /数三/, /高数/, /线代/, /概率论/, /张宇/, /李永乐/, /汤家凤/], weight: 10 },
  { category: "专业课-408", patterns: [/408/, /数据结构/, /操作系统/, /计算机组成/, /计算机网络/, /王道/], weight: 12 },
  { category: "专业课-其他", patterns: [/专业课/, /教育学/, /心理学/, /法硕/, /管理学/, /经济学/, /新传/, /新闻传播/, /临床医学/], weight: 8 },
  { category: "院校信息", patterns: [/报录比/, /复试/, /调剂/, /院校/, /导师/, /真题回忆/, /经验贴/], weight: 8 },
  { category: "公共课综合", patterns: [/全程班/, /全年/, /系统班/, /网课/, /视频/, /课件/], weight: 3 },
];

function yearOf(name: string): number | null {
  const m = name.match(/(20[2-3]\d)/);
  return m ? Number(m[1]) : null;
}

function baseName(p: string) {
  return path.basename(p.replace(/\\/g, "/"));
}

function classify(line: string): Hit {
  const name = baseName(line.trim());
  const reasons: string[] = [];
  let best = "未分类";
  let score = 0;
  for (const rule of RULES) {
    let s = 0;
    for (const re of rule.patterns) {
      if (re.test(name) || re.test(line)) {
        s += rule.weight;
        reasons.push(re.source);
      }
    }
    if (s > score) {
      score = s;
      best = rule.category;
    }
  }
  return { raw: line.trim(), name, category: score > 0 ? best : "未分类", year: yearOf(name), score, reasons };
}

function walkDir(dir: string, acc: string[] = [], depth = 0): string[] {
  if (depth > 8) return acc; // 防止极深目录拖死
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name.startsWith(".")) continue;
    if (e.isDirectory()) {
      acc.push(full + path.sep);
      walkDir(full, acc, depth + 1);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function readList(): string[] {
  const args = process.argv.slice(2);
  const scanIdx = args.indexOf("--scan");
  if (scanIdx >= 0 && args[scanIdx + 1]) {
    const target = args[scanIdx + 1];
    console.log("扫描目录:", target);
    return walkDir(target);
  }
  if (!fs.existsSync(INPUT)) {
    fs.mkdirSync(path.dirname(INPUT), { recursive: true });
    fs.writeFileSync(
      INPUT,
      `# 把网盘文件/文件夹路径每行一条贴这里，例如：
# /考研资料/政治/2026肖秀荣精讲精练.pdf
# /考研资料/英语/英一真题2016-2025/
`,
      "utf8",
    );
    console.log("已创建示例清单:", INPUT);
    console.log("请填入路径后重新运行，或使用: npx tsx scripts/organize-netdisk.ts --scan \"你的本地目录\"");
    return [];
  }
  return fs
    .readFileSync(INPUT, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function main() {
  const lines = readList();
  if (!lines.length) return;

  fs.mkdirSync(OUT, { recursive: true });
  const hits = lines.map(classify);

  const byCat: Record<string, Hit[]> = {};
  for (const h of hits) {
    (byCat[h.category] ||= []).push(h);
  }

  // 每类取分数最高的前 30 个作为「先上架候选」
  const featured: Hit[] = [];
  for (const [cat, list] of Object.entries(byCat)) {
    if (cat === "未分类") continue;
    const top = [...list].sort((a, b) => b.score - a.score || (b.year || 0) - (a.year || 0)).slice(0, 30);
    featured.push(...top);
  }

  const summary = Object.fromEntries(
    Object.entries(byCat).map(([k, v]) => [k, v.length]),
  );

  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT, "classified.json"), JSON.stringify(byCat, null, 2), "utf8");
  fs.writeFileSync(
    path.join(OUT, "featured-candidates.json"),
    JSON.stringify(featured, null, 2),
    "utf8",
  );

  // 给人看的 Markdown
  const md: string[] = [
    "# 网盘自动分类结果",
    "",
    `共处理 **${hits.length}** 条路径。`,
    "",
    "## 各类数量",
    "",
    ...Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## 建议先上架（每类 Top，共 " + featured.length + " 项）",
    "",
    "| 分类 | 年份 | 名称 |",
    "|------|------|------|",
    ...featured.map((h) => `| ${h.category} | ${h.year || "-"} | ${h.name} |`),
    "",
    "## 下一步",
    "",
    "1. 打开 `featured-candidates.json`，确认哪些真要上架",
    "2. 只给这些文件夹生成百度/阿里/夸克分享链接（不要给 6TB 全部生成）",
    "3. 把「名称 + 三个链接」发我，我写成网站商品文案",
    "",
  ];
  fs.writeFileSync(path.join(OUT, "REPORT.md"), md.join("\n"), "utf8");

  // 搬家建议：按分类建立目标相对路径（仅建议，不执行移动）
  const moves = hits
    .filter((h) => h.category !== "未分类")
    .map((h) => ({
      from: h.raw,
      to: `整理后/${h.category}/${h.year || "未标注年份"}/${h.name}`,
    }));
  fs.writeFileSync(path.join(OUT, "move-plan.json"), JSON.stringify(moves.slice(0, 5000), null, 2), "utf8");

  console.log("完成。统计:", summary);
  console.log("报告:", path.join(OUT, "REPORT.md"));
  console.log("先上架候选:", path.join(OUT, "featured-candidates.json"));
  console.log("提示: 6TB 不要全量搬家；只用候选清单生成分享链接。");
}

main();
