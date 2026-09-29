"use client";

import { useState } from "react";

export function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg border border-line px-2 py-0.5 text-xs hover:border-accent hover:text-accent"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "已复制" : label}
    </button>
  );
}
