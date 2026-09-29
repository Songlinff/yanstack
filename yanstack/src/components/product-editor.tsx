"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { defaultThreeLinks, parseDelivery } from "@/lib/utils";

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

export function ProductEditor({
  product,
  categories,
}: {
  product?: Product | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const initialLinks = product
    ? parseDelivery(product.deliveryPayload).links
    : defaultThreeLinks();
  while (initialLinks.length < 3) {
    initialLinks.push({ name: `网盘${initialLinks.length + 1}`, url: "", code: "" });
  }

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
    link1Name: initialLinks[0]?.name || "百度网盘",
    link1Url: initialLinks[0]?.url || "",
    link1Code: initialLinks[0]?.code || "",
    link2Name: initialLinks[1]?.name || "阿里云盘",
    link2Url: initialLinks[1]?.url || "",
    link2Code: initialLinks[1]?.code || "",
    link3Name: initialLinks[2]?.name || "夸克网盘",
    link3Url: initialLinks[2]?.url || "",
    link3Code: initialLinks[2]?.code || "",
    note: parseDelivery(product?.deliveryPayload || "{}").note || "三个网盘内容相同，任选一个。",
  });

  return (
    <form
      className="surface mt-6 space-y-3 rounded-3xl p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const deliveryPayload = JSON.stringify({
          links: [
            { name: form.link1Name, url: form.link1Url, code: form.link1Code },
            { name: form.link2Name, url: form.link2Url, code: form.link2Code },
            { name: form.link3Name, url: form.link3Url, code: form.link3Code },
          ],
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
        <div className="mb-3 font-semibold">三个网盘领取链接</div>
        {[1, 2, 3].map((n) => (
          <div key={n} className="mb-3 grid gap-2 sm:grid-cols-3">
            <input
              className="rounded-xl border border-line px-3 py-2 text-sm"
              placeholder={`网盘${n}名称`}
              value={String(form[`link${n}Name` as keyof typeof form])}
              onChange={(e) => setForm({ ...form, [`link${n}Name`]: e.target.value })}
            />
            <input
              className="rounded-xl border border-line px-3 py-2 text-sm sm:col-span-2"
              placeholder="下载链接 URL"
              value={String(form[`link${n}Url` as keyof typeof form])}
              onChange={(e) => setForm({ ...form, [`link${n}Url`]: e.target.value })}
            />
            <input
              className="rounded-xl border border-line px-3 py-2 text-sm sm:col-span-3"
              placeholder="提取码（可空）"
              value={String(form[`link${n}Code` as keyof typeof form])}
              onChange={(e) => setForm({ ...form, [`link${n}Code`]: e.target.value })}
            />
          </div>
        ))}
        <label className="block text-sm">
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
