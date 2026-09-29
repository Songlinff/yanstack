"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="text-ink-soft hover:text-warm"
      onClick={async () => {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" }),
        });
        window.location.href = "/";
      }}
    >
      退出
    </button>
  );
}
