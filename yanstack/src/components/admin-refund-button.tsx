"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminRefundButton({ orderNo, status }: { orderNo: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (!["PAID", "FULFILLED"].includes(status)) return null;
  return (
    <button
      type="button"
      className="btn btn-ghost text-sm text-warm"
      disabled={loading}
      onClick={async () => {
        const reason = prompt("退款备注（仅后台标记，不自动原路退款）");
        if (reason === null) return;
        setLoading(true);
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "refundOrder", orderNo, reason }),
        });
        setLoading(false);
        if (!res.ok) alert((await res.json()).error || "失败");
        else router.refresh();
      }}
    >
      标记退款
    </button>
  );
}
