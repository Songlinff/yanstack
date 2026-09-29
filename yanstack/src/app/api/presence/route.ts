import { NextResponse } from "next/server";
import { z } from "zod";
import { getPresenceSnapshot, touchPresence } from "@/lib/presence";
import { getFrontPv, incrementFrontPv } from "@/lib/visits";

const heartbeatSchema = z.object({
  visitorId: z.string().min(8).max(64),
  path: z.string().max(200).optional(),
  isAdmin: z.boolean().optional(),
  /** 仅页面切换/首次进入时记一次 PV，心跳续期不要带 */
  countVisit: z.boolean().optional(),
});

/** 心跳：前台每约 20 秒上报一次 */
export async function POST(req: Request) {
  try {
    const body = heartbeatSchema.parse(await req.json());
    const snapshot = touchPresence(body);

    let frontPv = await getFrontPv();
    if (body.countVisit && !body.isAdmin) {
      frontPv = await incrementFrontPv();
    }

    return NextResponse.json({
      ok: true,
      online: snapshot.online,
      frontOnline: snapshot.frontOnline,
      frontPv,
    });
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
