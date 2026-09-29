import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories, announcement] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { soldCount: "desc" },
      take: 6,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.siteSetting.findUnique({ where: { key: "announcement" } }),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="absolute inset-0 grid-noise opacity-70" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl anim-float" />
        <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-warm/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="anim-rise">
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent">YANSTACK</p>
            <h1 className="brand-display text-5xl leading-tight text-ink md:text-6xl">研栈</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">
              把真正有用的考研资料，交到你手里。真题精析、冲刺笔记、院校信息，免费领取，三网盘任选下载。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary">
                浏览资料库
              </Link>
            </div>
          </div>
          <div className="anim-rise-delay relative min-h-[280px] overflow-hidden rounded-[2rem] bg-ink text-white shadow-[var(--shadow)]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(13,148,136,.55), transparent 55%), url('/covers/hero-study.svg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative flex h-full flex-col justify-end p-8">
              <div className="text-sm text-white/70">免费领取 · 科目齐全 · 三网盘下载</div>
              <div className="mt-2 brand-display text-3xl">凌晨的书桌，也值得被照亮</div>
            </div>
          </div>
        </div>
      </section>

      {announcement?.value && (
        <div className="border-b border-line/70 bg-accent/5">
          <p className="mx-auto max-w-6xl px-4 py-3 text-sm text-ink-soft">{announcement.value}</p>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="brand-display text-3xl text-ink">按科目找资料</h2>
            <p className="mt-2 text-sm text-ink-soft">政治 / 英语 / 数学 / 专业课 / 院校信息</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="surface rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-accent"
            >
              <div className="font-semibold text-ink">{c.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="brand-display text-3xl text-ink">精选资料</h2>
            <p className="mt-2 text-sm text-ink-soft">全部免费，点击立即领取即可下载</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-accent hover:text-accent-deep">
            查看全部 →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="border-t border-line/70 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="brand-display text-3xl text-ink">领取说明</h2>
          <p className="mt-2 text-sm text-ink-soft">三步拿到资料，无需支付。</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { t: "选资料", d: "按科目、年份筛选，进入详情页。" },
              { t: "立即领取", d: "点击按钮后弹出三个网盘选项。" },
              { t: "任选下载", d: "百度 / 阿里 / 夸克任选一个打开即可。" },
            ].map((x) => (
              <div key={x.t} className="surface rounded-2xl p-5">
                <div className="font-semibold text-ink">{x.t}</div>
                <p className="mt-2 text-sm text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
