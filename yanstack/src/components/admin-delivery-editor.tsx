"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminDeliveryEditor({ itemId, initial }: { itemId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" className="mt-3 text-xs text-accent" onClick={() => setOpen(true)}>
        编辑交付内容
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="min-h-28 w-full rounded-xl border border-line px-3 py-2 font-mono text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary text-sm"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const res = await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "updateDelivery",
                itemId,
                deliverySnapshot: value,
              }),
            });
            setLoading(false);
            if (!res.ok) alert((await res.json()).error || "保存失败");
            else {
              setOpen(false);
              router.refresh();
            }
          }}
        >
          保存交付
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(false)}>
          取消
        </button>
      </div>
    </div>
  );
}
