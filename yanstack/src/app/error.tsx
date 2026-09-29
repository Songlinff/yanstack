"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="brand-display text-3xl">出了点问题</h1>
      <p className="mt-3 text-sm text-ink-soft">{error.message || "页面加载失败"}</p>
      <button className="btn btn-primary mt-6" onClick={reset}>
        重试
      </button>
    </div>
  );
}
