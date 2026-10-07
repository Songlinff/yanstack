import {
  coverHeadline,
  coverSubline,
  resolveCoverTheme,
} from "@/lib/product-cover";

type Props = {
  title: string;
  subject?: string | null;
  year?: number | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  className?: string;
};

/** 按商品信息动态绘制封面（CSS，避免 SVG 水合不一致） */
export function ProductCover({
  title,
  subject,
  year,
  categorySlug,
  categoryName,
  className = "",
}: Props) {
  const theme = resolveCoverTheme({ subject, categorySlug, title });
  const headline = coverHeadline(title, subject);
  const sub = coverSubline(year, categoryName);

  return (
    <div
      role="img"
      aria-label={title}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-56 w-56 rounded-full opacity-30"
        style={{ background: theme.blob || theme.to }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/10"
      />
      <div className="absolute inset-0 flex flex-col justify-center px-6 py-5 sm:px-8">
        <p
          className="brand-display leading-snug text-white"
          style={{ fontSize: headline.length > 10 ? "1.35rem" : "1.65rem" }}
        >
          {headline}
        </p>
        <p className="mt-2 text-sm" style={{ color: theme.accent }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
