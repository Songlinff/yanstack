"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderLookupForm() {
  const [orderNo, setOrderNo] = useState("");
  const router = useRouter();
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (orderNo.trim()) router.push(`/orders/${orderNo.trim()}`);
      }}
    >
      <input
        className="flex-1 rounded-xl border border-line px-3 py-2"
        placeholder="输入订单号，如 YS2026..."
        value={orderNo}
        onChange={(e) => setOrderNo(e.target.value)}
      />
      <button className="btn btn-ink" type="submit">
        查询
      </button>
    </form>
  );
}
