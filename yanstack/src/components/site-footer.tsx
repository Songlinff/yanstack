import Image from "next/image";
import Link from "next/link";
import { FrontVisitStat } from "./online-monitor";

export function SiteFooter({ showSponsor = true }: { showSponsor?: boolean }) {
  const site = process.env.NEXT_PUBLIC_SITE_NAME || "研栈";
  return (
    <footer className="mt-auto">
      {showSponsor && (
        <section className="border-t border-[var(--warm)]/25 bg-gradient-to-br from-[#fff7f0] via-[#ffeee0] to-[#f3f6fa]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-center sm:gap-10 md:py-12">
            <div className="shrink-0 rounded-2xl border-2 border-[var(--warm)]/40 bg-white p-3 shadow-[0_12px_36px_rgba(196,92,38,0.22)]">
              <Image
                src="/sponsor-qr.jpg"
                alt="赞赏码"
                width={240}
                height={240}
                className="h-52 w-52 rounded-xl object-cover sm:h-60 sm:w-60"
                priority={false}
              />
            </div>
            <div className="max-w-md text-center sm:text-left">
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--warm)]">扫码支持一下</p>
              <p className="brand-display mt-2 text-2xl leading-snug text-ink md:text-3xl">
                有你们的支持，我们才更有整理资料的动力
              </p>
              <p className="mt-3 text-sm text-ink-soft">资料持续免费更新，感谢每一份鼓励</p>
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-line/80 bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <div className="brand-display text-2xl">{site}</div>
            <p className="mt-3 text-sm text-white/70">
              面向考研人的免费资料站：真题、笔记、院校信息，一键领取网盘下载。
            </p>
          </div>
          <div className="text-sm text-white/75">
            <div className="mb-2 font-semibold text-white">浏览</div>
            <div className="flex flex-col gap-1">
              <Link href="/products">全部资料</Link>
            </div>
          </div>
          <div className="text-sm text-white/75">
            <div className="mb-2 font-semibold text-white">说明</div>
            <p>资料免费领取，点击后可选择百度 / 阿里 / 夸克网盘下载。内容以商品页为准。</p>
            <p className="mt-2">有问题点右下角橙色「意见反馈」，我们会尽快处理。</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {site} · 考研资料平台
          <span className="mx-2 text-white/25">·</span>
          <FrontVisitStat />
        </div>
      </div>
    </footer>
  );
}
