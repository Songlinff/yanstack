import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  findUserByEmail,
  hashPassword,
  verifyPassword,
  destroySession,
  getSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("请输入有效邮箱")
  .max(120);

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "sendRegisterCode") {
      const email = emailSchema.parse(body.email);
      const exists = await findUserByEmail(email);
      if (exists) {
        return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 400 });
      }

      const recent = await prisma.emailCode.findFirst({
        where: {
          email,
          purpose: "register",
          createdAt: { gte: new Date(Date.now() - 60_000) },
        },
        orderBy: { createdAt: "desc" },
      });
      if (recent) {
        return NextResponse.json({ error: "发送太频繁，请约 1 分钟后再试" }, { status: 429 });
      }

      const code = genCode();
      await prisma.emailCode.create({
        data: {
          email,
          code,
          purpose: "register",
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      });

      const mail = await sendVerificationEmail(email, code);
      const payload: Record<string, unknown> = {
        ok: true,
        message: mail.sent ? "验证码已发送，请查收邮箱" : "验证码已生成（当前未配置 SMTP，见下方提示）",
        mailed: mail.sent,
      };
      // 未配 SMTP 时便于本地联调；生产环境勿暴露
      if (!mail.sent && process.env.NODE_ENV !== "production") {
        payload.devCode = code;
      }
      return NextResponse.json(payload);
    }

    if (action === "register") {
      const schema = z
        .object({
          email: emailSchema,
          code: z.string().trim().regex(/^\d{6}$/, "请输入 6 位验证码"),
          password: z
            .string()
            .min(8, "密码至少 8 位")
            .max(72)
            .regex(/[A-Za-z]/, "密码需包含字母")
            .regex(/[0-9]/, "密码需包含数字"),
          confirmPassword: z.string(),
          name: z.string().trim().min(1).max(40).optional(),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: "两次输入的密码不一致",
          path: ["confirmPassword"],
        });

      const data = schema.parse(body);
      const exists = await findUserByEmail(data.email);
      if (exists) {
        return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 400 });
      }

      const record = await prisma.emailCode.findFirst({
        where: {
          email: data.email,
          purpose: "register",
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!record || record.code !== data.code) {
        return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
      }

      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name || data.email.split("@")[0],
          passwordHash: await hashPassword(data.password),
        },
      });

      await prisma.emailCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "USER" | "ADMIN",
      });

      return NextResponse.json({
        ok: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    if (action === "login") {
      const data = z
        .object({
          email: emailSchema,
          password: z.string().min(1, "请输入密码"),
        })
        .parse(body);

      const user = await findUserByEmail(data.email);
      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        return NextResponse.json({ error: "邮箱或密码错误" }, { status: 400 });
      }
      if (user.isBlocked) {
        return NextResponse.json({ error: "账号已被停用，请联系客服" }, { status: 403 });
      }
      await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "USER" | "ADMIN",
      });
      return NextResponse.json({
        ok: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ ok: true });
    }

    if (action === "me") {
      const user = await getSession();
      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.issues[0]?.message || "参数错误";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
