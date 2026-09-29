"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "yanstack_vid";
const HEARTBEAT_MS = 20_000;

function getVisitorId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `tmp-${Math.random().toString(36).slice(2)}`;
  }
}

/** 静默心跳 + 前台页面访问计数 */
export function PresenceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let stopped = false;
    const visitorId = getVisitorId();
    const isAdmin = Boolean(pathname?.startsWith("/admin"));
    let first = true;

    async function beat(countVisit: boolean) {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            path: pathname || "/",
            isAdmin,
            countVisit: countVisit && !isAdmin,
          }),
          keepalive: true,
        });
      } catch {
        // 网络抖动忽略
      }
    }

    void beat(first);
    first = false;

    const timer = window.setInterval(() => void beat(false), HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void beat(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
