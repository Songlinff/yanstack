"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "";

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="brand-display text-4xl">邮箱登录</h1>
      <p className="mt-2 text-sm text-ink-soft">使用注册时的邮箱与密码登录</p>

      <form
        className="surface mt-6 space-y-4 rounded-3xl p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          try {
            const res = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "login", email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "登录失败");
              return;
            }
            if (next) router.push(next);
            else router.push(data.user?.role === "ADMIN" ? "/admin" : "/");
            router.refresh();
          } catch {
            setError("网络异常，请稍后重试");
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="block text-sm font-medium">
          邮箱
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium">
          密码
          <div className="relative mt-1.5">
            <input
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="请输入密码"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 pr-16 text-sm outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft"
              onClick={() => setShowPwd((v) => !v)}
            >
              {showPwd ? "隐藏" : "显示"}
            </button>
          </div>
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </button>

        <p className="text-center text-sm text-ink-soft">
          还没有账号？
          <Link href="/register" className="font-semibold text-accent">
            邮箱注册
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-soft">加载中…</div>}>
      <LoginForm />
    </Suspense>
  );
}
