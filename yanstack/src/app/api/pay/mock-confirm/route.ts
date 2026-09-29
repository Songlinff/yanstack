import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "支付功能已关闭" }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "支付功能已关闭" }, { status: 410 });
}
