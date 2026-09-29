"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "./logout-button";
import { MobileNav } from "./mobile-nav";

type User = { id: string; email: string; name: string; role: string };

export function SiteHeader() {
  const site = process.env.NEXT_PUBLIC_SITE_NAME || "研栈";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me" }),
    })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-[#f3f6fa]/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link href="/" className="brand-display text-2xl font-bold text-ink">
            {site}
            <span className="ml-2 align-middle text-sm font-sans font-medium text-accent">考研资料</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <Link href="/products" className="hover:text-accent">
            全部资料
          </Link>
          <Link href="/products?category=politics" className="hover:text-accent">
            政治
          </Link>
          <Link href="/products?category=english" className="hover:text-accent">
            英语
          </Link>
          <Link href="/products?category=math" className="hover:text-accent">
            数学
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-ink-soft sm:inline">{user.name}</span>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="btn btn-ghost px-3 py-1.5">
                  后台
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-accent">
                登录
              </Link>
              <Link href="/register" className="btn btn-primary px-3 py-1.5 text-sm">
                邮箱注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
