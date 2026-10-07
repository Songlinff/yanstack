/**
 * 用 input/filelist.txt 为商品填充「目录」previewPages
 * 用法: npx tsx scripts/fill-preview-from-filelist.ts
 *
 * 规则：每个商品对应夸克冷库路径（来自 quark-share-links.json 的 path），
 * 取该路径下「直接子项」名称写入 previewPages。
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function loadPaths(): string[] {
  const file = join(process.cwd(), "input", "filelist.txt");
  if (!existsSync(file)) throw new Error("缺少 input/filelist.txt");
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.replace(/\\/g, "/").replace(/\/+$/, ""));
}

function normalize(p: string) {
  return p.replace(/\\/g, "/").replace(/\/+$/, "");
}

/** 取 parent 下直接子项的显示名 */
function childrenOf(all: string[], parent: string): string[] {
  const base = normalize(parent);
  const prefix = base + "/";
  const names = new Set<string>();
  for (const p of all) {
    if (!p.startsWith(prefix)) continue;
    const rest = p.slice(prefix.length);
    if (!rest) continue;
    const name = rest.split("/")[0];
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

type ShareItem = { key: string; path: string; productTitle?: string };

async function main() {
  const all = loadPaths();
  const shareFile = join(process.cwd(), "output", "quark-share-links.json");
  let items: ShareItem[] = [];
  if (existsSync(shareFile)) {
    const data = JSON.parse(readFileSync(shareFile, "utf8")) as { items: ShareItem[] };
    items = data.items || [];
  }

  // 没有 share json 时：用 slug qk-* 与 path 尾段模糊匹配
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, title: true, previewPages: true },
  });

  let updated = 0;
  for (const product of products) {
    const key = product.slug.replace(/^qk-/, "");
    const share = items.find((i) => i.key === key);
    let parentPath = share?.path ? normalize(share.path) : "";

    // 兜底：在 filelist 里找标题相关的最深路径
    if (!parentPath) {
      const hit = all
        .filter((p) => product.title && p.includes(product.title.slice(0, 8)))
        .sort((a, b) => b.length - a.length)[0];
      if (hit) parentPath = hit;
    }

    let toc = parentPath ? childrenOf(all, parentPath) : [];

    // filelist 往往只扫到包这一层：没有子项时，用同级信息或包名本身作提示
    if (toc.length === 0 && parentPath) {
      const leaf = parentPath.split("/").pop();
      if (leaf) toc = [`📦 ${leaf}`, "（完整文件列表请打开夸克分享查看）"];
    }

    if (toc.length === 0) {
      console.log("SKIP", product.slug, "无路径/无子项");
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { previewPages: JSON.stringify(toc.slice(0, 40)) },
    });
    updated += 1;
    console.log("OK", product.slug, `目录 ${Math.min(toc.length, 40)} 项`, parentPath);
  }

  console.log(`完成：更新 ${updated}/${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
