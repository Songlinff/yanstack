"use client";

import { useEffect, useState } from "react";
import { getKaoyanCountdown } from "@/lib/kaoyan";

/** 首页 / 全站可用的考研倒计时 + 每日励志语（客户端挂载后再算日期，避免水合不一致） */
export function ExamCountdown() {
  const [data, setData] = useState<ReturnType<typeof getKaoyanCountdown> | null>(null);

  useEffect(() => {
    setData(getKaoyanCountdown());
  }, []);

  const daysLeft = data?.daysLeft;
  const label = data?.label ?? "2027考研初试";
  const examDateText = data?.examDateText ?? "2026年12月19日–20日";
  const quote = data?.quote ?? "把今天的题做完，就是对未来最好的交代。";
  const ended = data?.ended ?? false;

  return (
    <section className="border-b border-line/70 bg-gradient-to-r from-accent/10 via-white/60 to-warm/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-accent">{label}</p>
            <p className="mt-1 text-sm text-ink-soft">初试 {examDateText} · 以教育部公告为准</p>
          </div>
        </div>

        <div className="flex items-baseline gap-2" suppressHydrationWarning>
          {data === null ? (
            <>
              <span className="text-sm text-ink-soft">还有</span>
              <span className="brand-display text-5xl leading-none text-accent/40 sm:text-6xl">—</span>
              <span className="text-sm font-semibold text-ink">天</span>
            </>
          ) : ended ? (
            <p className="brand-display text-2xl text-ink sm:text-3xl">初试已至，祝你下笔有神</p>
          ) : (
            <>
              <span className="text-sm text-ink-soft">还有</span>
              <span className="brand-display text-5xl leading-none text-accent sm:text-6xl">
                {daysLeft}
              </span>
              <span className="text-sm font-semibold text-ink">天</span>
            </>
          )}
        </div>

        <p className="max-w-md text-sm leading-relaxed text-ink-soft sm:text-right" suppressHydrationWarning>
          <span className="text-accent">今日寄语 · </span>
          {quote}
        </p>
      </div>
    </section>
  );
}
