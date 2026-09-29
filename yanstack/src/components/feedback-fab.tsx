"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "./toast";

const CATEGORIES = ["建议", "问题", "资料", "其他"] as const;

export function FeedbackFab() {
  const pathname = usePathname();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("建议");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content,
          contact: contact || null,
          pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交失败");
      push("反馈已提交，感谢你！", "ok");
      setContent("");
      setContact("");
      setCategory("建议");
      setOpen(false);
    } catch (err) {
      push(err instanceof Error ? err.message : "提交失败", "err");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="意见反馈"
        className={`fixed right-4 z-[55] flex items-center gap-2 rounded-full bg-[var(--warm)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(196,92,38,0.45)] transition hover:scale-[1.03] hover:bg-[#a84c1f] focus:outline-none focus:ring-2 focus:ring-[var(--warm)] focus:ring-offset-2 bottom-24 md:bottom-6 ${
          pulse ? "anim-pulse-soft" : ""
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        意见反馈
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="意见反馈"
          onClick={() => setOpen(false)}
        >
          <form
            className="anim-rise w-full max-w-md rounded-3xl bg-white p-5 shadow-[var(--shadow)]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="brand-display text-2xl text-ink">意见反馈</h2>
                <p className="mt-1 text-sm text-ink-soft">资料缺漏、链接失效、功能建议都可以说</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-line px-2 py-1 text-sm text-ink-soft"
                onClick={() => setOpen(false)}
              >
                关闭
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    category === c
                      ? "bg-[var(--warm)] text-white"
                      : "border border-line bg-paper text-ink-soft hover:border-[var(--warm)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium text-ink">
              反馈内容
              <textarea
                required
                minLength={5}
                maxLength={2000}
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请尽量写清：哪个资料 / 什么问题 / 期望怎么改进"
                className="mt-1.5 w-full resize-y rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <label className="mt-3 block text-sm font-medium text-ink">
              联系方式（选填）
              <input
                type="text"
                maxLength={120}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="微信 / QQ / 邮箱，方便我们回访"
                className="mt-1.5 w-full rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>

            <p className="mt-2 text-xs text-ink-soft">当前页面会一并提交，便于定位问题。</p>

            <button
              type="submit"
              disabled={submitting}
              className="btn mt-5 w-full bg-[var(--warm)] text-white hover:bg-[#a84c1f] disabled:opacity-60"
            >
              {submitting ? "提交中…" : "提交反馈"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
