"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPublishToggle({ id, isPublished }: { id: string; isPublished: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className={`rounded-full px-2 py-0.5 text-xs ${
        isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
      }`}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "togglePublish", id }),
        });
        setLoading(false);
        router.refresh();
      }}
    >
      {isPublished ? "上架" : "下架"}
    </button>
  );
}
