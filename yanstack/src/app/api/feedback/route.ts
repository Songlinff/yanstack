import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  category: z.enum(["建议", "问题", "资料", "其他"]).default("建议"),
  content: z.string().trim().min(5, "请至少写 5 个字").max(2000),
  contact: z.string().trim().max(120).optional().nullable(),
  pageUrl: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const session = await getSession();
    const feedback = await prisma.feedback.create({
      data: {
        category: body.category,
        content: body.content,
        contact: body.contact || null,
        pageUrl: body.pageUrl || null,
        userId: session?.id || null,
        userEmail: session?.email || null,
        userName: session?.name || null,
        status: "NEW",
      },
    });
    return NextResponse.json({ ok: true, id: feedback.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "提交失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
