import Link from "next/link";
import { parseSchoolTags } from "@/lib/utils";
import { ProductCover } from "@/components/product-cover";

type ProductCardProps = {
  product: {
    title: string;
    slug: string;
    summary: string;
    coverUrl: string;
    priceCents: number;
    originalCents: number | null;
    subject: string | null;
    year: number | null;
    schoolTags: string;
    soldCount?: number;
    category?: { name?: string; slug?: string } | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const tags = parseSchoolTags(product.schoolTags);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group surface block overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-deep">
        <ProductCover
          title={product.title}
          subject={product.subject}
          year={product.year}
          categorySlug={product.category?.slug}
          categoryName={product.category?.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-white">
          {product.subject || "资料"}
          {product.year ? ` · ${product.year}` : ""}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
          免费
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-accent-deep">
          {product.title}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-soft/90">{product.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-paper-deep px-1.5 py-0.5 text-[11px] text-ink-soft">
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between pt-1">
          <span className="text-lg font-bold text-accent">免费领取</span>
          <span className="text-xs text-ink-soft">已领 99+</span>
        </div>
      </div>
    </Link>
  );
}
