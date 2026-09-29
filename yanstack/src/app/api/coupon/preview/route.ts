import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "优惠券已停用（免费领取模式）" }, { status: 410 });
}
