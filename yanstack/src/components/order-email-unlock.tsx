"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrderEmailUnlock({ orderNo }: { orderNo: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  return (
    <form
      className="surface mt-4 space-y-3 rounded-2xl p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.includes("@")) {
          setError("请输入下单时使用的邮箱");
          return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set("email", email.trim().toLowerCase());
        router.push(url.pathname + "?" + url.searchParams.toString());
        router.refresh();
      }}
    >
      <div className="font-semibold text-ink">验证邮箱后查看交付内容</div>
      <p className="text-sm text-ink-soft">
        为保护网盘链接，请输入订单 {orderNo} 下单时填写的邮箱。
      </p>
      <input
        className="w-full rounded-xl border border-line px-3 py-2"
        placeholder="buyer@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary" type="submit">
        解锁交付信息
      </button>
    </form>
  );
}
