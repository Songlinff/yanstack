"use client";

import { useState } from "react";

export default function AdminExportPage() {
  const [busy, setBusy] = useState("");

  async function download(type: string) {
    setBusy(type);
    try {
      const res = await fetch(`/api/admin?view=export&type=${type}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yanstack-${type}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-display text-3xl">数据导出</h1>
        <p className="mt-1 text-sm text-ink-soft">对标 LDC Shop 导出：订单 / 商品 / 优惠券 JSON</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { type: "orders", label: "导出订单" },
          { type: "products", label: "导出商品" },
          { type: "coupons", label: "导出优惠券" },
        ].map((x) => (
          <button
            key={x.type}
            type="button"
            className="rounded-2xl border border-line bg-white p-6 text-left shadow-sm transition hover:border-accent"
            disabled={!!busy}
            onClick={() => download(x.type)}
          >
            <div className="font-semibold">{busy === x.type ? "导出中…" : x.label}</div>
            <div className="mt-1 text-xs text-ink-soft">下载 JSON 文件</div>
          </button>
        ))}
      </div>
    </div>
  );
}
