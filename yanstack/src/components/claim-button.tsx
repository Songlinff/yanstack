"use client";

import { useState } from "react";
import type { NetdiskLink } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { useToast } from "./toast";

type Props = {
  productId: string;
  title: string;
  links: NetdiskLink[];
  note?: string;
  stock?: number;
  compact?: boolean;
};

export function ClaimButton({ productId, title, links, note, stock, compact }: Props) {
  const [open, setOpen] = useState(false);
  const { push } = useToast();
  const soldOut = stock === 0;
  const options = links.slice(0, 3);

  async function onClaim() {
    if (soldOut) return;
    try {
      await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      /* 领取展示不阻断 */
    }
    setOpen(true);
    push("请选择网盘领取", "ok");
  }

  if (soldOut) {
    return (
      <button className="btn btn-ghost opacity-60" disabled>
        已领完
      </button>
    );
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={onClaim}>
        {compact ? "领取" : "立即领取"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="选择网盘领取"
          onClick={() => setOpen(false)}
        >
          <div
            className="anim-rise w-full max-w-md rounded-3xl bg-white p-5 shadow-[var(--shadow)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="brand-display text-2xl text-ink">选择网盘领取</h2>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{title}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-line px-2 py-1 text-sm text-ink-soft"
                onClick={() => setOpen(false)}
              >
                关闭
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {options.length === 0 && (
                <p className="text-sm text-ink-soft">暂未配置网盘链接，请联系管理员。</p>
              )}
              {options.map((link, idx) => (
                <div
                  key={`${link.name}-${idx}`}
                  className="rounded-2xl border border-line bg-paper/80 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-ink">
                      {idx + 1}. {link.name}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ink px-3 py-1.5 text-sm"
                    >
                      打开下载
                    </a>
                  </div>
                  {link.code && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                      提取码：<span className="font-mono font-semibold text-ink">{link.code}</span>
                      <CopyButton text={link.code} label="复制" />
                    </div>
                  )}
                  {link.note && <p className="mt-1 text-xs text-ink-soft">{link.note}</p>}
                </div>
              ))}
            </div>

            {note && <p className="mt-4 text-xs text-ink-soft">{note}</p>}
            <p className="mt-3 text-xs text-ink-soft">任选一个网盘即可，三个渠道内容相同。</p>
          </div>
        </div>
      )}
    </>
  );
}
