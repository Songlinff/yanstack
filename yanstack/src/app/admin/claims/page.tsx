import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; productId?: string }> };

function fmt(d: Date) {
  return d.toLocaleString("zh-CN", { hour12: false });
}

export default async function AdminClaimsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const productId = (sp.productId || "").trim();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalClaims, todayClaims, products, recent] = await Promise.all([
    prisma.claimEvent.count(),
    prisma.claimEvent.count({ where: { createdAt: { gte: since24h } } }),
    prisma.product.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { slug: { contains: q } },
              { subject: { contains: q } },
            ],
          }
        : undefined,
      include: {
        category: true,
        _count: { select: { claimEvents: true } },
      },
      orderBy: { soldCount: "desc" },
    }),
    prisma.claimEvent.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        product: { select: { id: true, title: true, slug: true, subject: true } },
      },
    }),
  ]);

  const sumSold = products.reduce((n, p) => n + p.soldCount, 0);
  const filterProduct = productId ? products.find((p) => p.id === productId) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-display text-3xl">领取统计</h1>
          <p className="mt-1 text-sm text-ink-soft">
            前台统一展示「已领 99+」；此处为真实领取计数与流水
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "计数器累计（soldCount）", value: sumSold },
          { label: "流水条数（ClaimEvent）", value: totalClaims },
          { label: "近 24 小时流水", value: todayClaims },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="text-xs text-ink-soft">{s.label}</div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索资料标题 / slug / 科目"
          className="max-w-md flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
        />
        <button className="btn btn-ink text-sm" type="submit">
          搜索
        </button>
        {productId && (
          <Link href="/admin/claims" className="btn btn-ghost text-sm">
            清除资料筛选
          </Link>
        )}
      </form>

      {filterProduct && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          正在查看：<span className="font-semibold">{filterProduct.title}</span>
          <span className="text-ink-soft"> · 真实已领 {filterProduct.soldCount}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3 font-semibold">各资料真实领取</div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-deep/60 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">资料</th>
              <th className="hidden px-4 py-3 md:table-cell">分类</th>
              <th className="px-4 py-3">真实已领</th>
              <th className="px-4 py-3">流水条数</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-ink-soft">
                    {p.subject || "—"} {p.year ? `· ${p.year}` : ""}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-ink-soft md:table-cell">{p.category.name}</td>
                <td className="px-4 py-3 font-semibold text-accent">{p.soldCount}</td>
                <td className="px-4 py-3 text-ink-soft">{p._count.claimEvents}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/claims?productId=${p.id}`}
                      className="text-accent"
                    >
                      流水
                    </Link>
                    <Link href={`/admin/products/${p.id}`} className="text-ink-soft">
                      编辑
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-soft">暂无资料</div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3 font-semibold">
          最近领取流水{productId ? "（已筛选）" : ""}
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-deep/60 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3">资料</th>
              <th className="hidden px-4 py-3 md:table-cell">IP</th>
              <th className="hidden px-4 py-3 lg:table-cell">UA</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => (
              <tr key={e.id} className="border-b border-line/50 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{fmt(e.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/claims?productId=${e.productId}`} className="font-medium text-accent">
                    {e.product.title}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs text-ink-soft md:table-cell">
                  {e.ip || "—"}
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-ink-soft lg:table-cell">
                  {e.userAgent || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recent.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-soft">
            暂无领取流水（上线后用户点击「立即领取」才会写入）
          </div>
        )}
      </section>
    </div>
  );
}
