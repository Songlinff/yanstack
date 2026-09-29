"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartBadge() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <Link href="/cart" className="relative rounded-full border border-line px-3 py-1.5 hover:border-accent">
      购物车
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-warm px-1 text-[11px] text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
