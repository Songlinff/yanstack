"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [devCode, setDevCode] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    setError("");
    setInfo("");
    setDevCode("");
    setSending(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendRegisterCode", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }
      setCooldown(60);
      setInfo(data.message || "验证码已发送");
      if (data.devCode) {
        setDevCode(data.devCode);
        setCode(data.devCode);
      }
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          email,
          code,
          name: name.trim() || undefined,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="brand-display text-4xl">邮箱注册</h1>
      <p className="mt-2 text-sm text-ink-soft">仅支持邮箱注册，验证码发到邮箱后完成开户</p>

      <form className="surface mt-6 space-y-4 rounded-3xl p-6" onSubmit={onSubmit}>
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
          邮箱验证码
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              placeholder="6 位数字"
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <button
              type="button"
              disabled={sending || cooldown > 0 || !email.trim()}
              onClick={sendCode}
              className="shrink-0 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {cooldown > 0 ? `${cooldown}s` : sending ? "发送中" : "获取验证码"}
            </button>
          </div>
        </label>

        <label className="block text-sm font-medium">
          昵称<span className="font-normal text-ink-soft">（选填）</span>
          <input
            type="text"
            maxLength={40}
            placeholder="不填则使用邮箱前缀"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium">
          密码
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="至少 8 位，需含字母和数字"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium">
          确认密码
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="再输入一次密码"
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {info && <p className="text-sm text-emerald-700">{info}</p>}
        {devCode && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            开发模式（未配置 SMTP）：验证码 <strong className="font-mono">{devCode}</strong>
          </p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}

        <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? "注册中…" : "注册并登录"}
        </button>

        <p className="text-center text-sm text-ink-soft">
          已有账号？
          <Link href="/login" className="font-semibold text-accent">
            去登录
          </Link>
        </p>
      </form>
    </div>
  );
}
