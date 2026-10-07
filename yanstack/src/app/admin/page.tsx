import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPublishToggle } from "@/components/admin-publish-toggle";
import { OnlineMonitor } from "@/components/online-monitor";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productCount, userCount, claimTotal, published, recentProducts, newFeedback] =
    await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.product.aggregate({ _sum: { soldCount: true } }),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.product.findMany({
        orderBy: { soldCount: "desc" },
        take: 8,
        include: { category: true },
      }),
      prisma.feedback.count({ where: { status: "NEW" } }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-display text-3xl">运营仪表盘</h1>
          <p className="mt-1 text-sm text-ink-soft">免费领取模式：管理资料与夸克网盘链接</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {newFeedback > 0 && (
            <Link
              href="/admin/feedback"
              className="btn bg-[var(--warm)] text-sm text-white hover:bg-[#a84c1f]"
            >
              {newFeedback} 条新反馈
            </Link>
          )}
          <Link href="/admin/products/new" className="btn btn-primary text-sm">
            上架资料
          </Link>
        </div>
      </div>

      <OnlineMonitor />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "资料总数", value: productCount },
          { label: "已上架", value: published },
          { label: "累计领取", value: claimTotal._sum.soldCount || 0, href: "/admin/claims" },
          { label: "注册用户", value: userCount },
          { label: "未读反馈", value: newFeedback, href: "/admin/feedback", warm: true },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              "warm" in s && s.warm && s.value > 0 ? "border-[var(--warm)]/40" : "border-line"
            }`}
          >
            <div className="text-xs text-ink-soft">{s.label}</div>
            <div
              className={`mt-2 text-2xl font-bold ${
                "warm" in s && s.warm && s.value > 0 ? "text-[var(--warm)]" : ""
              }`}
            >
              {"href" in s && s.href ? <Link href={s.href}>{s.value}</Link> : s.value}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">领取排行</h2>
          <Link href="/admin/products" className="text-sm text-accent">
            全部资料
          </Link>
        </div>
        <div className="space-y-3">
          {recentProducts.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-line/50 pb-3 text-sm last:border-0"
            >
              <div>
                <div className="font-medium">
                  {i + 1}. {p.title}
                </div>
                <div className="text-ink-soft">
                  {p.category.name} · 已领 {p.soldCount}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminPublishToggle id={p.id} isPublished={p.isPublished} />
                <Link href={`/admin/products/${p.id}`} className="text-accent">
                  编辑
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
