"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "yanstack_vid";
const COOKIE_KEY = "yanstack_vid";
const HEARTBEAT_MS = 20_000;

function readCookie(name: string) {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

function writeCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function persistVisitorId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // private mode 等可能写失败，仍写 cookie
  }
  writeCookie(COOKIE_KEY, id);
}

function getVisitorId() {
  try {
    const fromLs = localStorage.getItem(STORAGE_KEY);
    if (fromLs && fromLs.length >= 8) {
      writeCookie(COOKIE_KEY, fromLs);
      return fromLs;
    }
  } catch {
    // continue
  }

  const fromCookie = readCookie(COOKIE_KEY);
  if (fromCookie && fromCookie.length >= 8) {
    persistVisitorId(fromCookie);
    return fromCookie;
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `vid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  persistVisitorId(id);
  return id;
}

/** 静默心跳 + 前台页面访问计数 */
export function PresenceTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>("");

  useEffect(() => {
    let stopped = false;
    if (!visitorIdRef.current) {
      visitorIdRef.current = getVisitorId();
    }
    const isAdmin = Boolean(pathname?.startsWith("/admin"));
    // 同一 pathname 的 effect 生命周期内只记一次 PV；心跳不记
    let countedThisPath = false;

    async function beat(countVisit: boolean) {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            path: pathname || "/",
            isAdmin,
            countVisit: countVisit && !isAdmin,
          }),
          keepalive: true,
          credentials: "same-origin",
        });
        if (res.ok) {
          const json = (await res.json()) as { visitorId?: string };
          // 服务端可能把登录用户收成稳定 id（如 admin:xxx）
          if (json.visitorId && json.visitorId.length >= 8) {
            visitorIdRef.current = json.visitorId;
            persistVisitorId(json.visitorId);
          }
        }
      } catch {
        // 网络抖动忽略
      }
    }

    if (!countedThisPath) {
      countedThisPath = true;
      void beat(true);
    }

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
