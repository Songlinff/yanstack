"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelOrderButton({ orderNo }: { orderNo: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost text-sm"
      disabled={loading}
      onClick={async () => {
        if (!confirm("确定取消该待支付订单？")) return;
        setLoading(true);
        const res = await fetch("/api/orders/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo }),
        });
        setLoading(false);
        if (res.ok) router.refresh();
        else alert((await res.json()).error || "取消失败");
      }}
    >
      {loading ? "取消中…" : "取消订单"}
    </button>
  );
}
