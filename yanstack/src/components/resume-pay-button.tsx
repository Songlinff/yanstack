"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResumePayButton({ orderNo }: { orderNo: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/orders/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) {
          alert(data.error || "发起支付失败");
          return;
        }
        if (data.pay?.payUrl) {
          window.location.href = data.pay.payUrl;
          return;
        }
        router.refresh();
      }}
    >
      {loading ? "跳转中…" : "继续支付"}
    </button>
  );
}
