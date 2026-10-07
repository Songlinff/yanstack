import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getPresenceSnapshot, touchPresence } from "@/lib/presence";
import { getFrontPv, incrementFrontPv } from "@/lib/visits";

const heartbeatSchema = z.object({
  visitorId: z.string().min(8).max(80),
  path: z.string().max(200).optional(),
  isAdmin: z.boolean().optional(),
  /** 仅页面切换/首次进入时记一次 PV，心跳续期不要带 */
  countVisit: z.boolean().optional(),
});

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    (forwarded ? forwarded.split(",")[0]?.trim() : "") ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

/** 心跳：前台每约 20 秒上报一次 */
export async function POST(req: Request) {
  try {
    const body = heartbeatSchema.parse(await req.json());
    const session = await getSession();
    const ip = clientIp(req);
    const pathIsAdmin = Boolean(body.path?.startsWith("/admin") || body.isAdmin);

    // 登录用户用稳定会话键，避免刷新/隐私模式导致 visitorId 变化从而重复计数
    let visitorId = body.visitorId;
    let dedupeKey = ip ? `ip:${ip}:${pathIsAdmin ? "admin" : "front"}` : undefined;
    if (session?.role === "ADMIN" && pathIsAdmin) {
      visitorId = `admin:${session.id}`;
      dedupeKey = `admin:${session.id}`;
    } else if (session) {
      visitorId = `user:${session.id}`;
      dedupeKey = `user:${session.id}`;
    }

    const snapshot = touchPresence({
      visitorId,
      path: body.path,
      isAdmin: pathIsAdmin,
      dedupeKey,
    });

    let frontPv = await getFrontPv();
    if (body.countVisit && !pathIsAdmin) {
      frontPv = await incrementFrontPv();
    }

    const res = NextResponse.json({
      ok: true,
      visitorId,
      online: snapshot.online,
      frontOnline: snapshot.frontOnline,
      adminOnline: snapshot.adminOnline,
      frontPv,
    });

    // 回写稳定 cookie，减轻 localStorage 失败时的抖动
    res.cookies.set("yanstack_vid", visitorId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
      secure: false,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "invalid heartbeat" }, { status: 400 });
  }
}

/** 查询当前在线人数 + 前台总访问 */
export async function GET() {
  const [snapshot, frontPv] = await Promise.all([getPresenceSnapshot(), getFrontPv()]);
  return NextResponse.json({
    online: snapshot.online,
    frontOnline: snapshot.frontOnline,
    adminOnline: snapshot.adminOnline,
    frontPv,
    ttlSeconds: snapshot.ttlSeconds,
    visitors: snapshot.visitors.map((v) => ({
      path: v.path,
      isAdmin: v.isAdmin,
      secondsAgo: v.secondsAgo,
    })),
  });
}
