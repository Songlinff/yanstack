import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ orderNo: z.string().min(6) });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const session = await getSession();
    const order = await prisma.order.findUnique({ where: { orderNo: body.orderNo } });
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    const allowed =
      session?.role === "ADMIN" ||
      (session && order.userId === session.id) ||
      !order.userId;
    if (!allowed) return NextResponse.json({ error: "无权取消" }, { status: 403 });
    const updated = await cancelOrder(body.orderNo, "用户取消");
    return NextResponse.json({ ok: true, status: updated.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "取消失败" },
      { status: 400 },
    );
  }
}
