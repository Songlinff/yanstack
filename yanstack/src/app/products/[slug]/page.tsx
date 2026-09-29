import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseDelivery, parseJsonArray, parseSchoolTags } from "@/lib/utils";
import { ClaimButton } from "@/components/claim-button";
import { ProductCard } from "@/components/product-card";
import { MobileBuyBar } from "@/components/mobile-buy-bar";

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
  });

  const tags = parseSchoolTags(product.schoolTags);
  const previews = parseJsonArray(product.previewPages);
  const delivery = parseDelivery(product.deliveryPayload);
  const stockLabel =
    product.stock < 0 ? "可领取" : product.stock === 0 ? "已领完" : `剩余 ${product.stock} 份`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 md:pb-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="surface overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.coverUrl} alt={product.title} className="aspect-[4/3] w-full object-cover" />
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
            <span className="pb-1 text-sm text-ink-soft">已领 {product.soldCount}</span>
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
            <p className="mt-1">点击「立即领取」后，可任选百度网盘 / 阿里云盘 / 夸克网盘其中一个渠道下载。</p>
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
        <article className="surface rounded-3xl p-6">
          <h2 className="brand-display text-2xl">详情</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-ink-soft">{product.description}</p>
        </article>
        <aside className="surface rounded-3xl p-6">
          <h3 className="font-semibold">试读 / 目录</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {previews.length ? (
              previews.map((p) => (
                <li key={p} className="rounded-lg bg-paper-deep px-3 py-2">
                  {p}
                </li>
              ))
            ) : (
              <li>暂无预览</li>
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
