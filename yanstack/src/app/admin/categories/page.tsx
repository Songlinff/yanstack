"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin?view=categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-display text-3xl">科目分类</h1>
        <p className="mt-1 text-sm text-ink-soft">政治/英语/数学等分类，支持排序与启停</p>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const res = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "upsertCategory",
              category: { ...form, sortOrder: Number(form.sortOrder) },
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "保存失败");
            return;
          }
          setForm({ name: "", slug: "", description: "", sortOrder: 0, isActive: true });
          await load();
        }}
      >
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="分类名"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="slug（英文）"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          required
        />
        <input
          className="rounded-xl border border-line px-3 py-2 sm:col-span-2"
          placeholder="描述"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          className="rounded-xl border border-line px-3 py-2"
          placeholder="排序"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
        />
        {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <button className="btn btn-primary sm:col-span-2" type="submit">
          保存分类
        </button>
      </form>

      <div className="space-y-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <div>
              <div className="font-semibold">
                {c.name}{" "}
                <span className="font-mono text-xs text-ink-soft">/{c.slug}</span>
              </div>
              <div className="text-sm text-ink-soft">
                {c.description || "无描述"} · 商品 {c._count?.products || 0} · 排序 {c.sortOrder}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className={`rounded-full px-2 py-0.5 text-xs ${
                  c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
                onClick={async () => {
                  await fetch("/api/admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "toggleCategory", id: c.id }),
                  });
                  await load();
                }}
              >
                {c.isActive ? "启用" : "停用"}
              </button>
              <Link href={`/products?category=${c.slug}`} className="text-sm text-accent">
                前台
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
