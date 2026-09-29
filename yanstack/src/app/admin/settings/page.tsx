"use client";

import { useEffect, useState } from "react";

const KEYS = [
  { key: "site_tagline", label: "站点标语" },
  { key: "announcement", label: "首页公告" },
  { key: "support_wechat", label: "客服微信" },
  { key: "support_email", label: "客服邮箱" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin?view=settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="brand-display text-3xl">站点设置</h1>
        <p className="mt-1 text-sm text-ink-soft">公告、客服信息（考研店铺特色字段）</p>
      </div>
      <form
        className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg("");
          for (const item of KEYS) {
            await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "updateSetting",
                key: item.key,
                value: settings[item.key] || "",
              }),
            });
          }
          setMsg("已保存");
        }}
      >
        {KEYS.map((item) => (
          <label key={item.key} className="block text-sm">
            {item.label}
            <textarea
              className="mt-1 min-h-16 w-full rounded-xl border border-line px-3 py-2"
              value={settings[item.key] || ""}
              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
            />
          </label>
        ))}
        {msg && <p className="text-sm text-accent">{msg}</p>}
        <button className="btn btn-primary" type="submit">
          保存设置
        </button>
      </form>
      <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-ink-soft">
        支付密钥、SMTP、域名等敏感配置请改 `yanstack/.env`，见仓库根目录《需要你填写的配置.md》。
      </div>
    </div>
  );
}
