"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { defaultQuarkLink, onlyQuarkLinks, parseDelivery } from "@/lib/utils";

type Category = { id: string; name: string };
type Product = {
  id: string;
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
  deliveryType: string;
  deliveryPayload: string;
  categoryId: string;
  isPublished: boolean;
  isFeatured: boolean;
};

function pickQuarkFromPayload(payload: string) {
  const parsed = parseDelivery(payload);
  // parseDelivery 已过滤夸克；编辑时若旧数据无夸克名，再从原始 links 里找
  try {
    const raw = JSON.parse(payload);
    if (Array.isArray(raw?.links)) {
      const found = onlyQuarkLinks(raw.links);
      if (found[0]) return found[0];
    }
  } catch {
    /* ignore */
  }
  return parsed.links[0] || defaultQuarkLink();
}

export function ProductEditor({
  product,
  categories,
}: {
  product?: Product | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const initial = product
    ? pickQuarkFromPayload(product.deliveryPayload)
    : defaultQuarkLink();

  const [form, setForm] = useState({
    title: product?.title || "",
    slug: product?.slug || "",
    summary: product?.summary || "",
    description: product?.description || "",
    coverUrl: product?.coverUrl || "/covers/politics.svg",
    stock: product?.stock ?? -1,
    year: product?.year || 2026,
    subject: product?.subject || "政治",
    schoolTags: product?.schoolTags || '["通用"]',
    examType: product?.examType || "统考",
    categoryId: product?.categoryId || categories[0]?.id || "",
    isPublished: product?.isPublished ?? true,
    isFeatured: product?.isFeatured ?? false,
    quarkUrl: initial.url || "",
    quarkCode: initial.code || "",
    note: parseDelivery(product?.deliveryPayload || "{}").note || "请使用夸克网盘 App 打开链接下载。",
  });

  return (
    <form
      className="surface mt-6 space-y-3 rounded-3xl p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const deliveryPayload = JSON.stringify({
          links: [{ name: "夸克网盘", url: form.quarkUrl, code: form.quarkCode }],
          note: form.note,
        });
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upsertProduct",
            product: {
              title: form.title,
              slug: form.slug,
              summary: form.summary,
              description: form.description,
              coverUrl: form.coverUrl,
              priceCents: 0,
              originalCents: null,
              stock: Number(form.stock),
              year: Number(form.year) || null,
              subject: form.subject,
              schoolTags: form.schoolTags,
              examType: form.examType,
              deliveryType: "NETDISK",
              deliveryPayload,
              categoryId: form.categoryId,
              isPublished: form.isPublished,
              isFeatured: form.isFeatured,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "保存失败");
          return;
        }
        router.push(`/admin/products`);
        router.refresh();
      }}
    >
      {(
        [
          ["title", "标题"],
          ["slug", "Slug"],
          ["summary", "简介"],
          ["subject", "科目"],
          ["examType", "考试类型"],
          ["coverUrl", "封面路径"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-sm">
          {label}
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={String(form[key])}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}

      <label className="block text-sm">
        详情
        <textarea
          className="mt-1 min-h-28 w-full rounded-xl border border-line px-3 py-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>

      <p className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent-deep">
        价格已固定为免费（¥0），前台显示「立即领取」。
      </p>

      <label className="block text-sm">
        库存（-1 不限）
        <input
          type="number"
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
        />
      </label>

      <label className="block text-sm">
        分类
        <select
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-line p-4">
        <div className="mb-3 font-semibold">夸克网盘领取链接</div>
        <div className="grid gap-2">
          <input
            className="rounded-xl border border-line px-3 py-2 text-sm"
            placeholder="夸克分享链接 URL"
            value={form.quarkUrl}
            onChange={(e) => setForm({ ...form, quarkUrl: e.target.value })}
          />
          <input
            className="rounded-xl border border-line px-3 py-2 text-sm"
            placeholder="提取码（可空）"
            value={form.quarkCode}
            onChange={(e) => setForm({ ...form, quarkCode: e.target.value })}
          />
        </div>
        <label className="mt-3 block text-sm">
          领取备注
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          上架
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
          />
          精选
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" type="submit">
        保存
      </button>
    </form>
  );
}
