import type { ReactNode } from "react";
import type { ProductDetailContent } from "@/lib/product-detail";

function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 text-sm leading-7 text-ink-soft">{children}</div>
    </div>
  );
}

export function ProductDetailPanel({ content }: { content: ProductDetailContent }) {
  return (
    <article className="surface rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="brand-display text-2xl text-ink">详情</h2>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-deep">
          {content.kindLabel}
        </span>
      </div>

      <Block title="资料简介">
        <p>{content.intro}</p>
      </Block>

      <Block title="你能拿到什么">
        <ul className="space-y-1.5">
          {content.highlights.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="适合谁">
        <ul className="space-y-1.5">
          {content.audience.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warm/80" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="怎么用更有效">
        <ol className="list-decimal space-y-1.5 pl-4">
          {content.howToUse.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </Block>

      <Block title="领取说明">
        <ul className="space-y-1.5">
          {content.claimTips.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </Block>
    </article>
  );
}
