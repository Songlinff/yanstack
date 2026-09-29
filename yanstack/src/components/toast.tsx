"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone?: "ok" | "err" | "info" };

const ToastCtx = createContext<{
  push: (message: string, tone?: Toast["tone"]) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-[min(90vw,320px)] flex-col gap-2 md:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            className={`anim-rise rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
              t.tone === "ok" ? "bg-emerald-700" : t.tone === "err" ? "bg-red-700" : "bg-ink"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { push: (_m: string, _t?: Toast["tone"]) => {} };
  return ctx;
}
