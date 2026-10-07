/**
 * 只重同步指定 slug 的目录预览（与 sync-quark-toc 同一套完整两层逻辑）
 * 用法: npx tsx scripts/resync-one-toc.ts qk-zhenti-zhengzhi
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API = "https://drive-pc.quark.cn/1/clouddrive";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_ITEMS = 200;

type QuarkFile = { fid: string; file_name: string; dir: boolean };

function parsePwdId(url: string) {
  const clean = url.split("?")[0];
  const pwdId = clean.split("/s/").pop()?.split("#")[0] || "";
  const m = url.match(/[?&]pwd=([^&]+)/);
  return { pwdId, passcode: m?.[1] || "" };
}

function extractQuarkUrl(deliveryPayload: string) {
  try {
    const data = JSON.parse(deliveryPayload);
    const links = Array.isArray(data?.links) ? data.links : [];
    const q =
      links.find(
        (l: { name?: string; url?: string }) =>
          String(l.name || "").includes("夸克") || String(l.url || "").includes("quark"),
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
      Origin: "https://pan.quark.cn",
      Referer: "https://pan.quark.cn/",
    },
    body: JSON.stringify({ pwd_id: pwdId, passcode }),
  });
  const json = (await res.json()) as { data?: { stoken?: string }; message?: string };
  if (!json?.data?.stoken) throw new Error(json?.message || "token failed");
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
      headers: { "User-Agent": UA, Origin: "https://pan.quark.cn", Referer: "https://pan.quark.cn/" },
    });
    const json = (await res.json()) as {
      data?: { list?: Array<Record<string, unknown>> };
      metadata?: { _total?: number };
    };
    const list = json.data?.list || [];
    for (const f of list) {
      files.push({
        fid: String(f.fid),
        file_name: String(f.file_name || ""),
        dir: Boolean(f.dir),
      });
    }
    const total = json.metadata?._total ?? files.length;
    if (page * 50 >= total || list.length === 0) break;
    page += 1;
  }
  return files;
}

async function buildToc(pwdId: string, stoken: string) {
  let rootFid = "0";
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
        break;
      }
      const c = children[i];
      lines.push(`　${c.dir ? "📁 " : "📄 "}${c.file_name}`);
    }
  }
  return lines.slice(0, MAX_ITEMS);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("usage: npx tsx scripts/resync-one-toc.ts <slug>");
  const p = await prisma.product.findUniqueOrThrow({ where: { slug } });
  const url = extractQuarkUrl(p.deliveryPayload);
  const { pwdId, passcode } = parsePwdId(url);
  const stoken = await getStoken(pwdId, passcode);
  const toc = await buildToc(pwdId, stoken);
  await prisma.product.update({
    where: { id: p.id },
    data: { previewPages: JSON.stringify(toc) },
  });
  console.log("OK", slug, toc.length);
  toc.slice(0, 40).forEach((x, i) => console.log(String(i + 1).padStart(2), x));
  if (toc.length > 40) console.log("...");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
