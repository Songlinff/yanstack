export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900",
    PAID: "bg-sky-100 text-sky-900",
    FULFILLED: "bg-emerald-100 text-emerald-900",
    CANCELLED: "bg-slate-200 text-slate-700",
    REFUNDED: "bg-rose-100 text-rose-900",
  };
  const label: Record<string, string> = {
    PENDING: "待支付",
    PAID: "已支付",
    FULFILLED: "已发货",
    CANCELLED: "已取消",
    REFUNDED: "已退款",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] || "bg-paper-deep text-ink"}`}>
      {label[status] || status}
    </span>
  );
}
