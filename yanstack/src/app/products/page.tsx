import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    subject?: string;
    year?: string;
    sort?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const where: Record<string, unknown> = { isPublished: true };

  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { summary: { contains: sp.q } },
      { subject: { contains: sp.q } },
    ];
  }
  if (sp.subject) where.subject = { contains: sp.subject };
  if (sp.year) where.year = Number(sp.year);
  if (sp.category) where.category = { slug: sp.category };

  const orderBy =
    sp.sort === "price_asc"
      ? [{ priceCents: "asc" as const }]
      : sp.sort === "price_desc"
        ? [{ priceCents: "desc" as const }]
        : sp.sort === "new"
          ? [{ createdAt: "desc" as const }]
          : [{ isFeatured: "desc" as const }, { soldCount: "desc" as const }];

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where, orderBy, include: { category: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const chips = [
    sp.q && { key: "q", label: `搜索：${sp.q}` },
    sp.category && {
      key: "category",
      label: `分类：${categories.find((c) => c.slug === sp.category)?.name || sp.category}`,
    },
    sp.subject && { key: "subject", label: `科目：${sp.subject}` },
    sp.year && { key: "year", label: `年份：${sp.year}` },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="brand-display text-4xl text-ink">资料库</h1>
        <p className="mt-2 text-ink-soft">免费领取，夸克网盘下载。</p>
      </div>

      <form method="get" className="surface mb-4 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="搜索真题、笔记、院校…"
          className="rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          aria-label="搜索资料"
        />
        <select
          name="category"
          defaultValue={sp.category || ""}
          className="rounded-xl border border-line bg-white px-3 py-2"
          aria-label="分类"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="year" defaultValue={sp.year || ""} className="rounded-xl border border-line bg-white px-3 py-2" aria-label="年份">
          <option value="">全部年份</option>
          {[2026, 2025, 2024].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sp.sort || ""} className="rounded-xl border border-line bg-white px-3 py-2" aria-label="排序">
          <option value="">综合排序</option>
          <option value="new">最新上架</option>
          <option value="price_asc">价格从低到高</option>
          <option value="price_desc">价格从高到低</option>
        </select>
        <button className="btn btn-primary" type="submit">
          筛选
        </button>
      </form>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c.key} className="rounded-full bg-paper-deep px-3 py-1 text-xs text-ink-soft">
              {c.label}
            </span>
          ))}
          <Link href="/products" className="text-xs text-accent hover:underline">
            清除筛选
          </Link>
          <span className="ml-auto text-xs text-ink-soft">共 {products.length} 件</span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="surface rounded-2xl p-12 text-center">
          <div className="brand-display text-2xl text-ink">没有找到匹配资料</div>
          <p className="mt-2 text-sm text-ink-soft">试试放宽筛选条件，或浏览全部分类。</p>
          <Link href="/products" className="btn btn-primary mt-6 inline-flex">
            查看全部
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
