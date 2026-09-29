import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ channels: [], message: "支付功能已关闭" });
}
