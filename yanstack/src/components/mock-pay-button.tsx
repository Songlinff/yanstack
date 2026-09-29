"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MockPayButton({ orderNo }: { orderNo: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <button
      className="btn btn-primary"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/pay/mock-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo }),
        });
        setLoading(false);
        if (res.ok) router.refresh();
        else alert((await res.json()).error || "支付失败");
      }}
    >
      {loading ? "支付中…" : "确认模拟支付"}
    </button>
  );
}
