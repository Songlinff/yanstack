"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminOrderActions({ orderNo, status }: { orderNo: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: string) {
    setLoading(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, orderNo }),
    });
    setLoading(false);
    if (!res.ok) {
      alert((await res.json()).error || "操作失败");
      return;
    }
    router.refresh();
  }

  if (status === "PENDING") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          className="text-xs text-accent disabled:opacity-50"
          disabled={loading}
          onClick={() => run("manualFulfill")}
        >
          手动发货
        </button>
        <button
          className="text-xs text-warm disabled:opacity-50"
          disabled={loading}
          onClick={() => run("cancelOrder")}
        >
          取消
        </button>
      </div>
    );
  }
  return (
    <a href={`/admin/orders/${orderNo}`} className="text-xs text-accent">
      详情
    </a>
  );
}
