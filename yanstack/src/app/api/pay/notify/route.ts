import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("payment disabled", { status: 410 });
}

export async function POST() {
  return new NextResponse("payment disabled", { status: 410 });
}
