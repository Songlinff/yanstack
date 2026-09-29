"use client";

import { useCallback, useEffect, useState } from "react";

type FeedbackRow = {
  id: string;
  category: string;
  content: string;
  contact: string | null;
  pageUrl: string | null;
  userEmail: string | null;
  userName: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "未读",
  READ: "已读",
  DONE: "已处理",
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [status, setStatus] = useState("");
  const [counts, setCounts] = useState({ NEW: 0, READ: 0, DONE: 0, all: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const q = status ? `?view=feedback&status=${status}` : "?view=feedback";
    const res = await fetch(`/api/admin${q}`);
    const data = await res.json();
    setItems(data.feedbacks || []);
    setCounts(data.counts || { NEW: 0, READ: 0, DONE: 0, all: 0 });
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function setFeedbackStatus(id: string, next: string, adminNote?: string) {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateFeedback",
        id,
        status: next,
        adminNote: adminNote ?? undefined,
      }),
    });
    setEditing(null);
    setNote("");
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-display text-3xl">用户反馈</h1>
        <p className="mt-1 text-sm text-ink-soft">前台右下角「意见反馈」提交的内容会集中在这里</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "", label: `全部 ${counts.all}` },
          { key: "NEW", label: `未读 ${counts.NEW}` },
          { key: "READ", label: `已读 ${counts.READ}` },
          { key: "DONE", label: `已处理 ${counts.DONE}` },
        ].map((t) => (
          <button
            key={t.key || "all"}
            type="button"
            onClick={() => setStatus(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === t.key
                ? "bg-[var(--warm)] text-white"
                : "border border-line bg-white text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink-soft">
            暂无反馈
          </div>
        )}
        {items.map((f) => (
          <article
            key={f.id}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              f.status === "NEW" ? "border-[var(--warm)]/50 ring-1 ring-[var(--warm)]/20" : "border-line"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-paper-deep px-2 py-0.5 font-medium">{f.category}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    f.status === "NEW"
                      ? "bg-[var(--warm)]/15 text-[var(--warm)]"
                      : f.status === "DONE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-ink-soft"
                  }`}
                >
                  {STATUS_LABEL[f.status] || f.status}
                </span>
                <span className="text-xs text-ink-soft">
                  {new Date(f.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {f.status === "NEW" && (
                  <button
                    type="button"
                    className="text-accent"
                    onClick={() => setFeedbackStatus(f.id, "READ")}
                  >
                    标为已读
                  </button>
                )}
                {f.status !== "DONE" && (
                  <button
                    type="button"
                    className="text-emerald-700"
                    onClick={() => setFeedbackStatus(f.id, "DONE")}
                  >
                    标为已处理
                  </button>
                )}
                {f.status === "DONE" && (
                  <button
                    type="button"
                    className="text-ink-soft"
                    onClick={() => setFeedbackStatus(f.id, "READ")}
                  >
                    重新打开
                  </button>
                )}
                <button
                  type="button"
                  className="text-ink-soft"
                  onClick={() => {
                    setEditing(editing === f.id ? null : f.id);
                    setNote(f.adminNote || "");
                  }}
                >
                  备注
                </button>
              </div>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{f.content}</p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
              {(f.userName || f.userEmail) && (
                <span>
                  用户：{f.userName || "—"} {f.userEmail ? `· ${f.userEmail}` : ""}
                </span>
              )}
              {f.contact && <span>联系：{f.contact}</span>}
              {f.pageUrl && (
                <a href={f.pageUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                  来源页面
                </a>
              )}
            </div>

            {f.adminNote && editing !== f.id && (
              <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-xs text-ink-soft">
                备注：{f.adminNote}
              </p>
            )}

            {editing === f.id && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                  placeholder="内部备注（用户不可见）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ink px-4 py-2 text-sm"
                  onClick={() => setFeedbackStatus(f.id, f.status, note)}
                >
                  保存备注
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
