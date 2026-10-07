"use client";

import { useEffect, useState } from "react";

type PresenceData = {
  online: number;
  frontOnline: number;
  adminOnline: number;
  frontPv: number;
  visitors: { path: string; isAdmin: boolean; secondsAgo: number }[];
};

const POLL_MS = 8_000;

export function OnlineMonitor({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<PresenceData | null>(null);

  useEffect(() => {
    let stopped = false;

    async function load() {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as PresenceData;
        if (!stopped) setData(json);
      } catch {
        // ignore
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  const online = data?.online ?? 0;
  const front = data?.frontOnline ?? 0;
  const pv = data?.frontPv ?? 0;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-white/70"
        title="在线人数 · 前台累计访问"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        在线 {online}
        <span className="text-white/35">|</span>
        访问 {pv}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">网站监控</h2>
          <p className="mt-1 text-xs text-ink-soft">
            在线：约 60 秒内心跳；同一登录账号只计 1 人。访问次数：前台打开/切换页面 +1（后台不计）。每 8 秒刷新。
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          实时
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-paper-deep/70 p-4">
          <div className="text-xs text-ink-soft">前台总访问</div>
          <div className="mt-1 text-3xl font-bold text-accent">{pv}</div>
        </div>
        <div className="rounded-xl bg-paper-deep/70 p-4">
          <div className="text-xs text-ink-soft">总在线</div>
          <div className="mt-1 text-3xl font-bold text-ink">{online}</div>
        </div>
        <div className="rounded-xl bg-paper-deep/70 p-4">
          <div className="text-xs text-ink-soft">前台在线</div>
          <div className="mt-1 text-3xl font-bold">{front}</div>
        </div>
        <div className="rounded-xl bg-paper-deep/70 p-4">
          <div className="text-xs text-ink-soft">后台在线</div>
          <div className="mt-1 text-3xl font-bold">{data?.adminOnline ?? 0}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-ink-soft">最近活跃页面</div>
        {!data?.visitors?.length ? (
          <p className="text-sm text-ink-soft">暂无在线访客</p>
        ) : (
          <ul className="max-h-48 space-y-1.5 overflow-auto text-sm">
            {data.visitors.slice(0, 20).map((v, i) => (
              <li
                key={`${v.path}-${i}-${v.secondsAgo}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line/60 px-3 py-1.5"
              >
                <span className="truncate font-mono text-xs text-ink">
                  {v.isAdmin ? "[后台] " : ""}
                  {v.path}
                </span>
                <span className="shrink-0 text-xs text-ink-soft">{v.secondsAgo}s 前</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** 前台页脚用的访问次数展示 */
export function FrontVisitStat() {
  const [pv, setPv] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopped = false;
    setReady(true);
    fetch("/api/presence", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { frontPv?: number }) => {
        if (!stopped && typeof j.frontPv === "number") setPv(j.frontPv);
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, []);

  if (!ready || pv === null) return null;
  return (
    <span suppressHydrationWarning>
      累计访问 {pv.toLocaleString("zh-CN")} 次
    </span>
  );
}
