/**
 * 从夸克分享链接拉取目录，写入商品 previewPages（无需登录）
 * 用法: npx tsx scripts/sync-quark-toc.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API = "https://drive-pc.quark.cn/1/clouddrive";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_ITEMS = 200; // 预览条目上限（优先保证第一层文件夹名齐全）

type QuarkFile = {
  fid: string;
  file_name: string;
  dir: boolean;
  size?: number;
};

function parsePwdId(url: string): { pwdId: string; passcode: string } {
  const clean = url.split("?")[0];
  const pwdId = clean.split("/s/").pop()?.split("#")[0] || "";
  const m = url.match(/[?&]pwd=([^&]+)/);
  return { pwdId, passcode: m?.[1] || "" };
}

function extractQuarkUrl(deliveryPayload: string): string {
  try {
    const data = JSON.parse(deliveryPayload);
    const links = Array.isArray(data?.links) ? data.links : [];
    const q =
      links.find(
        (l: { name?: string; url?: string }) =>
          String(l.name || "").includes("夸克") ||
          String(l.url || "").includes("quark"),
      ) || links[links.length - 1];
    return String(q?.url || "");
  } catch {
    return "";
  }
}

async function getStoken(pwdId: string, passcode: string) {
  const res = await fetch(`${API}/share/sharepage/token?pr=ucpro&fr=pc`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: "https://pan.quark.cn",
      Referer: "https://pan.quark.cn/",
    },
    body: JSON.stringify({ pwd_id: pwdId, passcode }),
  });
  const json = (await res.json()) as {
    status?: number;
    code?: number;
    message?: string;
    data?: { stoken?: string };
  };
  if (!json?.data?.stoken) {
    throw new Error(json?.message || `token failed: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.data.stoken;
}

async function listDir(pwdId: string, stoken: string, pdirFid = "0") {
  const files: QuarkFile[] = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      pr: "ucpro",
      fr: "pc",
      pwd_id: pwdId,
      stoken,
      pdir_fid: pdirFid,
      force: "0",
      _page: String(page),
      _size: "50",
      _fetch_total: "1",
      _sort: "file_type:asc,file_name:asc",
    });
    const res = await fetch(`${API}/share/sharepage/detail?${params}`, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        Origin: "https://pan.quark.cn",
        Referer: "https://pan.quark.cn/",
      },
    });
    const json = (await res.json()) as {
      data?: { list?: Array<Record<string, unknown>> };
      metadata?: { _total?: number };
      message?: string;
    };
    const list = json.data?.list || [];
    for (const f of list) {
      files.push({
        fid: String(f.fid),
        file_name: String(f.file_name || ""),
        dir: Boolean(f.dir),
        size: typeof f.size === "number" ? f.size : undefined,
      });
    }
    const total = json.metadata?._total ?? files.length;
    if (page * 50 >= total || list.length === 0) break;
    page += 1;
    await sleep(200);
  }
  return files;
}

async function buildToc(
  pwdId: string,
  stoken: string,
  pdirFid = "0",
): Promise<string[]> {
  // 若分享根只有一个包装文件夹，直接进入，避免 TOC 只显示一层壳
  let rootFid = pdirFid;
  let top = await listDir(pwdId, stoken, rootFid);
  if (top.length === 1 && top[0].dir) {
    rootFid = top[0].fid;
    top = await listDir(pwdId, stoken, rootFid);
  }

  const lines: string[] = [];

  for (let ti = 0; ti < top.length; ti++) {
    const f = top[ti];
    if (lines.length >= MAX_ITEMS - 1) {
      lines.push(`…另有 ${top.length - ti} 个顶层项未列出，请打开夸克查看`);
      break;
    }
    lines.push(`${f.dir ? "📁 " : "📄 "}${f.file_name}`);
    if (!f.dir) continue;

    const children = await listDir(pwdId, stoken, f.fid);
    for (let i = 0; i < children.length; i++) {
      if (lines.length >= MAX_ITEMS - 1) {
        lines.push(`　…还有 ${children.length - i} 项，请打开夸克查看`);
        // 仍尽量带上后续顶层文件夹名
        break;
      }
      const c = children[i];
      lines.push(`　${c.dir ? "📁 " : "📄 "}${c.file_name}`);
    }
    await sleep(100);
  }

  return lines.slice(0, MAX_ITEMS);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, title: true, deliveryPayload: true },
  });

  let ok = 0;
  let fail = 0;
  for (const p of products) {
    const url = extractQuarkUrl(p.deliveryPayload);
    if (!url.includes("quark.cn")) {
      console.log("SKIP", p.slug, "无夸克链接");
      fail += 1;
      continue;
    }
    try {
      const { pwdId, passcode } = parsePwdId(url);
      if (!pwdId) throw new Error("无法解析分享 ID");
      const stoken = await getStoken(pwdId, passcode);
      const toc = await buildToc(pwdId, stoken);
      if (!toc.length) {
        console.log("EMPTY", p.slug);
        fail += 1;
        continue;
      }
      await prisma.product.update({
        where: { id: p.id },
        data: { previewPages: JSON.stringify(toc) },
      });
      console.log("OK", p.slug, toc.length, "items");
      ok += 1;
      await sleep(400);
    } catch (e) {
      console.log("FAIL", p.slug, e instanceof Error ? e.message : e);
      fail += 1;
      await sleep(600);
    }
  }
  console.log(`Done. ok=${ok} fail=${fail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
