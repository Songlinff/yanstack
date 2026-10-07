/**
 * 用浏览器已打开的夸克分享页，从 window.store 抽目录。
 * 本脚本在本机 Node 侧维护结果；抓取动作由 Agent 浏览器完成。
 * 也可：npx tsx scripts/apply-toc-json.ts
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TOC_FILE = join(process.cwd(), "output", "toc-by-key.json");

async function main() {
  if (!existsSync(TOC_FILE)) throw new Error("缺少 output/toc-by-key.json");
  const map = JSON.parse(readFileSync(TOC_FILE, "utf8")) as Record<string, string[]>;

  // 对尚未抓取的分享：用 folderName 作为至少一项目录
  const shareFile = join(process.cwd(), "output", "quark-share-links.json");
  if (existsSync(shareFile)) {
    const data = JSON.parse(readFileSync(shareFile, "utf8")) as {
      items: { key: string; folderName?: string }[];
    };
    for (const item of data.items || []) {
      if (!map[item.key]?.length && item.folderName) {
        map[item.key] = [item.folderName];
      }
    }
  }

  let n = 0;
  for (const [key, toc] of Object.entries(map)) {
    if (!toc?.length) continue;
    const slug = key.startsWith("qk-") ? key : `qk-${key}`;
    const r = await prisma.product.updateMany({
      where: { OR: [{ slug }, { slug: key }] },
      data: { previewPages: JSON.stringify(toc.slice(0, 50)) },
    });
    if (r.count) {
      n += r.count;
      console.log("OK", slug, toc.length);
    } else console.log("MISS", slug);
  }
  console.log(`完成 ${n} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
