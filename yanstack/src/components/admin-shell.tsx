"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OnlineMonitor } from "./online-monitor";

const NAV = [
  { href: "/admin", label: "仪表盘", exact: true },
  { href: "/admin/products", label: "商品资料" },
  { href: "/admin/feedback", label: "用户反馈" },
  { href: "/admin/categories", label: "科目分类" },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/export", label: "数据导出" },
  { href: "/admin/settings", label: "站点设置" },
];

export function AdminShell({
  children,
  adminName,
  newFeedbackCount = 0,
}: {
  children: React.ReactNode;
  adminName: string;
  newFeedbackCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function active(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen bg-[#e8eef5] text-ink">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-line bg-ink text-white transition-transform md:static md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
            <span className="brand-display text-xl">研栈</span>
            <span className="rounded bg-accent/30 px-1.5 py-0.5 text-[10px] tracking-wider">ADMIN</span>
          </div>
          <nav className="space-y-0.5 p-3 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition ${
                  active(item.href, item.exact)
                    ? "bg-accent text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.href === "/admin/feedback" && newFeedbackCount > 0 && (
                  <span className="rounded-full bg-[var(--warm)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 text-xs text-white/50">
            <div className="truncate">{adminName}</div>
            <Link href="/" className="mt-1 inline-block text-accent hover:underline">
              ← 返回前台店铺
            </Link>
          </div>
        </aside>

        {open && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-[#f3f6fa]/95 px-4 backdrop-blur">
            <button
              type="button"
              className="rounded-lg border border-line px-2.5 py-1 text-sm md:hidden"
              onClick={() => setOpen(true)}
            >
              菜单
            </button>
            <div className="hidden items-center gap-4 md:flex">
              <span className="text-sm text-ink-soft">考研资料运营后台</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-full bg-ink px-2.5 py-1">
                <OnlineMonitor compact />
              </div>
              <span className="hidden text-ink-soft sm:inline">{adminName}</span>
              <Link href="/products" className="text-accent hover:underline">
                预览店铺
              </Link>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
