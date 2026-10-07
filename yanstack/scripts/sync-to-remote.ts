/**
 * 通过线上后台 API 同步本地商品（无需 SSH）
 * 用法: npx tsx scripts/sync-to-remote.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

const BASE = process.env.REMOTE_URL || "http://124.220.179.231";
const EMAIL = process.env.ADMIN_EMAIL || "admin@yanstack.local";
const PASSWORD = process.env.ADMIN_PASSWORD || "Admin123456";

type Product = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  coverUrl: string;
  priceCents: number;
  originalCents: number | null;
  stock: number;
  year: number | null;
  subject: string | null;
  schoolTags: string;
  examType: string;
  deliveryType: "NETDISK" | "FILE" | "CARD" | "MANUAL";
  deliveryPayload: string;
  previewPages: string;
  isPublished: boolean;
  isFeatured: boolean;
  categorySlug: string;
};

function cookieFromSetCookie(headers: Headers) {
  const raw = headers.getSetCookie?.() || [];
  if (raw.length) {
    return raw.map((c) => c.split(";")[0]).join("; ");
  }
  const single = headers.get("set-cookie");
  if (!single) return "";
  // Node may concatenate multiple
  return single
    .split(/,(?=\s*[^;=]+=)/)
    .map((c) => c.split(";")[0].trim())
    .join("; ");
}

async function main() {
  const file = join(process.cwd(), "output", "sync-payload.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    announcement: string;
    products: Product[];
  };

  const loginRes = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok || !loginBody.ok) {
    throw new Error(`登录失败: ${JSON.stringify(loginBody)}`);
  }
  const cookie = cookieFromSetCookie(loginRes.headers);
  if (!cookie) throw new Error("登录成功但未拿到 cookie");
  console.log("logged in");

  const catRes = await fetch(`${BASE}/api/admin?view=categories`, {
    headers: { cookie },
  });
  const catJson = await catRes.json();
  if (!catRes.ok) throw new Error(`categories: ${JSON.stringify(catJson)}`);
  const catMap = new Map<string, string>(
    (catJson.categories || []).map((c: { slug: string; id: string }) => [c.slug, c.id]),
  );

  // ensure categories exist
  for (const c of [
    { name: "政治", slug: "politics", description: "政治真题与网课资料", sortOrder: 1 },
    { name: "英语", slug: "english", description: "英语真题、词汇与网课", sortOrder: 2 },
    { name: "数学", slug: "math", description: "数学真题与网课资料", sortOrder: 3 },
    { name: "专业课", slug: "major", description: "统考专业课真题", sortOrder: 4 },
    { name: "院校信息", slug: "school", description: "复试、院校与综合资料", sortOrder: 5 },
  ]) {
    if (catMap.has(c.slug)) continue;
    const r = await fetch(`${BASE}/api/admin`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "upsertCategory", category: { ...c, isActive: true } }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`upsertCategory ${c.slug}: ${JSON.stringify(j)}`);
    catMap.set(c.slug, j.category.id);
    console.log("category", c.slug);
  }

  let ok = 0;
  for (const p of data.products) {
    const categoryId = catMap.get(p.categorySlug);
    if (!categoryId) throw new Error(`missing category ${p.categorySlug}`);
    // 线上 productSchema 不含 previewPages：把目录摘要塞进 description 末尾，避免详情页空白
    let description = p.description;
    try {
      const pages = JSON.parse(p.previewPages || "[]") as string[];
      if (pages.length) {
        const toc = pages.slice(0, 24).join("\n");
        description = `${p.description}\n\n【网盘目录预览】\n${toc}`;
      }
    } catch {
      /* ignore */
    }
    const product = {
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      description,
      coverUrl: p.coverUrl,
      priceCents: p.priceCents,
      originalCents: p.originalCents,
      stock: p.stock,
      year: p.year,
      subject: p.subject,
      schoolTags: p.schoolTags,
      examType: p.examType,
      deliveryType: p.deliveryType,
      deliveryPayload: p.deliveryPayload,
      categoryId,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
    };
    const r = await fetch(`${BASE}/api/admin`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "upsertProduct", product }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error("FAIL", p.slug, j);
      continue;
    }
    ok += 1;
    console.log("OK", p.slug);
  }

  // unpublish old seed demos (non qk-*)
  const dash = await fetch(`${BASE}/api/admin?view=export&type=products`, {
    headers: { cookie },
  });
  const dashJson = await dash.json();
  const remote = (dashJson.data || []) as Array<{
    id: string;
    slug: string;
    isPublished: boolean;
    title: string;
  }>;
  for (const item of remote) {
    if (item.slug.startsWith("qk-")) continue;
    if (!item.isPublished) continue;
    const r = await fetch(`${BASE}/api/admin`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "togglePublish", id: item.id }),
    });
    const j = await r.json();
    if (r.ok) console.log("unpublished", item.slug);
    else console.warn("unpublish fail", item.slug, j);
  }

  if (data.announcement) {
    const r = await fetch(`${BASE}/api/admin`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "updateSetting",
        key: "announcement",
        value: data.announcement,
      }),
    });
    const j = await r.json();
    if (!r.ok) console.warn("announcement", j);
    else console.log("announcement updated");
  }

  console.log(`\n完成：写入 ${ok}/${data.products.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
