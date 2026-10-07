import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPublishToggle } from "@/components/admin-publish-toggle";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const products = await prisma.product.findMany({
    where: sp.q
      ? {
          OR: [
            { title: { contains: sp.q } },
            { slug: { contains: sp.q } },
            { subject: { contains: sp.q } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: { category: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-display text-3xl">商品资料</h1>
        <p className="mt-1 text-sm text-ink-soft">考研资料免费领取，配置夸克网盘链接</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary text-sm">
          上架新资料
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="搜索标题 / slug / 科目"
          className="max-w-md flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
        />
        <button className="btn btn-ink text-sm" type="submit">
          搜索
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-deep/60 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">资料</th>
              <th className="hidden px-4 py-3 md:table-cell">分类</th>
              <th className="px-4 py-3">价格</th>
              <th className="px-4 py-3">库存/领取</th>
              <th className="px-4 py-3">状态</th>
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
                <td className="px-4 py-3 text-accent font-semibold">免费</td>
                <td className="px-4 py-3 text-ink-soft">
                  {p.stock < 0 ? "不限" : p.stock} / 已领 {p.soldCount}
                </td>
                <td className="px-4 py-3">
                  <AdminPublishToggle id={p.id} isPublished={p.isPublished} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/products/${p.id}`} className="text-accent">
                      编辑
                    </Link>
                    <Link href={`/products/${p.slug}`} className="text-ink-soft">
                      前台
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-soft">暂无商品</div>
        )}
      </div>
    </div>
  );
}
