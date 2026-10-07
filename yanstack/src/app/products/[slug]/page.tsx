import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseDelivery, parseJsonArray, parseSchoolTags } from "@/lib/utils";
import { buildProductDetailContent } from "@/lib/product-detail";
import { ClaimButton } from "@/components/claim-button";
import { ProductCard } from "@/components/product-card";
import { ProductCover } from "@/components/product-cover";
import { MobileBuyBar } from "@/components/mobile-buy-bar";
import { ProductDetailPanel } from "@/components/product-detail-panel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "资料不存在" };
  return {
    title: product.title,
    description: product.summary,
    openGraph: {
      title: product.title,
      description: product.summary,
      images: [product.coverUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, reviews: { include: { user: true }, take: 5 } },
  });
  if (!product || !product.isPublished) notFound();

  const related = await prisma.product.findMany({
    where: {
      isPublished: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 3,
    include: { category: true },
  });

  const tags = parseSchoolTags(product.schoolTags);
  const previews = parseJsonArray(product.previewPages);
  const delivery = parseDelivery(product.deliveryPayload);
  const detail = buildProductDetailContent({
    title: product.title,
    slug: product.slug,
    summary: product.summary,
    description: product.description,
    subject: product.subject,
    year: product.year,
    examType: product.examType,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    previewPages: previews,
  });
  const stockLabel =
    product.stock < 0 ? "可领取" : product.stock === 0 ? "已领完" : `剩余 ${product.stock} 份`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 md:pb-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="surface overflow-hidden rounded-3xl">
          <ProductCover
            title={product.title}
            subject={product.subject}
            year={product.year}
            categorySlug={product.category.slug}
            categoryName={product.category.name}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <div>
          <div className="text-sm text-accent">
            {product.category.name}
            {product.year ? ` · ${product.year}` : ""}
            {product.examType ? ` · ${product.examType}` : ""}
          </div>
          <h1 className="brand-display mt-2 text-4xl text-ink">{product.title}</h1>
          <p className="mt-3 text-ink-soft">{product.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-paper-deep px-3 py-1 text-xs text-ink-soft">
                {t}
              </span>
            ))}
            <span className="rounded-full bg-paper-deep px-3 py-1 text-xs text-ink-soft">{stockLabel}</span>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-bold text-accent">免费</span>
            <span className="pb-1 text-sm text-ink-soft">已领 99+</span>
          </div>
          <div className="mt-6 hidden md:block">
            <ClaimButton
              productId={product.id}
              title={product.title}
              links={delivery.links}
              note={delivery.note}
              stock={product.stock}
            />
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-white/70 p-4 text-sm text-ink-soft">
            <div className="font-semibold text-ink">领取说明</div>
            <p className="mt-1">点击「立即领取」后，通过夸克网盘打开链接下载。</p>
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <ProductDetailPanel content={detail} />
        <aside className="surface rounded-3xl p-6">
          <h3 className="font-semibold">资料目录</h3>
          <p className="mt-1 text-xs text-ink-soft">
            来自夸克分享预览（顶层文件夹 + 其下一级；过长会标注剩余项数）
          </p>
          <ul className="mt-3 max-h-[32rem] space-y-1 overflow-auto text-sm text-ink-soft">
            {previews.length ? (
              previews.map((p, i) => {
                const nested = p.startsWith("　") || p.startsWith("  ");
                const text = p.replace(/^[　\s]+/, "");
                return (
                  <li
                    key={`${i}-${p}`}
                    className={`rounded-lg bg-paper-deep/80 py-1.5 font-mono text-[12px] leading-relaxed tracking-tight ${
                      nested ? "ml-3 px-3 text-ink-soft/90" : "px-3"
                    }`}
                  >
                    {text}
                  </li>
                );
              })
            ) : (
              <li className="rounded-lg bg-paper-deep px-3 py-2">暂无目录，请稍后再看或直接领取下载</li>
            )}
          </ul>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="brand-display text-2xl">同科推荐</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <MobileBuyBar
        productId={product.id}
        title={product.title}
        links={delivery.links}
        note={delivery.note}
        stock={product.stock}
      />
    </div>
  );
}
