import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ productId: z.string().min(1) });

/** 免费领取：记录销量，不涉及支付 */
export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || !product.isPublished) {
      return NextResponse.json({ error: "资料不存在或已下架" }, { status: 404 });
    }
    if (product.stock === 0) {
      return NextResponse.json({ error: "已领完" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (product.stock > 0) {
        const fresh = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
        if (fresh.stock <= 0) throw new Error("已领完");
        return tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: 1 }, soldCount: { increment: 1 } },
        });
      }
      return tx.product.update({
        where: { id: product.id },
        data: { soldCount: { increment: 1 } },
      });
    });

    return NextResponse.json({ ok: true, soldCount: updated.soldCount });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "领取失败" },
      { status: 400 },
    );
  }
}
