"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/admin?view=users");
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      !q ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-display text-3xl">用户管理</h1>
        <p className="mt-1 text-sm text-ink-soft">搜索、拉黑/解封（对标 LDC Shop 顾客管理）</p>
      </div>
      <input
        className="w-full max-w-md rounded-xl border border-line bg-white px-3 py-2 text-sm"
        placeholder="搜索邮箱 / 昵称"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-deep/60 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">用户</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">订单</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-line/50 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-ink-soft">{u.email}</div>
                </td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u._count.orders}</td>
                <td className="px-4 py-3">{u.isBlocked ? "已拉黑" : "正常"}</td>
                <td className="px-4 py-3">
                  {u.role !== "ADMIN" && (
                    <button
                      className="text-xs text-accent"
                      onClick={async () => {
                        await fetch("/api/admin", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "toggleUserBlock", id: u.id }),
                        });
                        await load();
                      }}
                    >
                      {u.isBlocked ? "解封" : "拉黑"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
