"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        className="rounded-lg border border-line px-2.5 py-1.5 text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="菜单"
      >
        菜单
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-line bg-[#f3f6fa] px-4 py-3 shadow-lg">
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/products" onClick={() => setOpen(false)}>
              全部资料
            </Link>
            <Link href="/products?category=politics" onClick={() => setOpen(false)}>
              政治
            </Link>
            <Link href="/products?category=english" onClick={() => setOpen(false)}>
              英语
            </Link>
            <Link href="/products?category=math" onClick={() => setOpen(false)}>
              数学
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
