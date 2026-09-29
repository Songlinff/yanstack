import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markOrderPaid, cancelOrder } from "@/lib/orders";
import { availableChannels } from "@/lib/payments";
import { z } from "zod";

function dayStart(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "dashboard";

  if (view === "orders") {
    const status = url.searchParams.get("status") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { orderNo: { contains: q } },
        { guestEmail: { contains: q } },
        { guestContact: { contains: q } },
      ];
    }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, payments: true, user: { select: { email: true, name: true } } },
    });
    return NextResponse.json({ orders });
  }

  if (view === "users") {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    return NextResponse.json({ users });
  }

  if (view === "categories") {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ categories });
  }

  if (view === "settings") {
    const settings = await prisma.siteSetting.findMany();
    return NextResponse.json({
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    });
  }

  if (view === "payments") {
    return NextResponse.json({ channels: availableChannels() });
  }

  if (view === "feedback") {
    const status = url.searchParams.get("status") || undefined;
    const where = status ? { status } : {};
    const [feedbacks, grouped] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.feedback.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);
    const counts = { NEW: 0, READ: 0, DONE: 0, all: 0 };
    for (const g of grouped) {
      const n = g._count._all;
      counts.all += n;
      if (g.status === "NEW" || g.status === "READ" || g.status === "DONE") {
        counts[g.status] = n;
      }
    }
    return NextResponse.json({ feedbacks, counts });
  }

  if (view === "export") {
    const type = url.searchParams.get("type") || "orders";
    if (type === "orders") {
      const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ data: orders });
    }
    if (type === "products") {
      const products = await prisma.product.findMany({ include: { category: true } });
      return NextResponse.json({ data: products });
    }
    if (type === "coupons") {
      return NextResponse.json({ data: await prisma.coupon.findMany() });
    }
  }

  const start = dayStart(0);
  const week = dayStart(-6);

  const [
    products,
    orders,
    users,
    revenue,
    pending,
    todayRevenue,
    weekRevenue,
    lowStock,
    recent,
    coupons,
    topProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLED"] } },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLED"] }, paidAt: { gte: start } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLED"] }, paidAt: { gte: week } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { isPublished: true, stock: { gte: 0, lte: 5 } },
      take: 8,
      orderBy: { stock: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
    prisma.coupon.findMany({ orderBy: { code: "asc" }, take: 8 }),
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { soldCount: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    stats: {
      products,
      orders,
      users,
      revenueCents: revenue._sum.totalCents || 0,
      pending,
      todayRevenueCents: todayRevenue._sum.totalCents || 0,
      todayOrders: todayRevenue._count,
      weekRevenueCents: weekRevenue._sum.totalCents || 0,
      weekOrders: weekRevenue._count,
    },
    lowStock,
    recent,
    coupons,
    topProducts,
    channels: availableChannels(),
  });
}

const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  summary: z.string().min(2),
  description: z.string().min(2),
  coverUrl: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  originalCents: z.number().int().nonnegative().optional().nullable(),
  stock: z.number().int(),
  year: z.number().int().optional().nullable(),
  subject: z.string().optional().nullable(),
  schoolTags: z.string().default("[]"),
  examType: z.string().default("统考"),
  deliveryType: z.enum(["NETDISK", "FILE", "CARD", "MANUAL"]),
  deliveryPayload: z.string().min(2),
  categoryId: z.string(),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const couponSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().min(1),
  discountType: z.enum(["fixed", "percent"]),
  discountValue: z.number().int().positive(),
  minAmountCents: z.number().int().nonnegative().default(0),
  maxUses: z.number().int().positive().default(100),
  isActive: z.boolean().default(true),
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    if (body.action === "upsertProduct") {
      const data = productSchema.parse(body.product);
      const { id: _id, ...rest } = data;
      const product = await prisma.product.upsert({
        where: { slug: data.slug },
        update: rest,
        create: rest,
      });
      return NextResponse.json({ product });
    }

    if (body.action === "togglePublish") {
      const product = await prisma.product.findUniqueOrThrow({ where: { id: body.id } });
      const updated = await prisma.product.update({
        where: { id: body.id },
        data: { isPublished: !product.isPublished },
      });
      return NextResponse.json({ product: updated });
    }

    if (body.action === "deleteProduct") {
      await prisma.product.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "upsertCoupon") {
      const data = couponSchema.parse(body.coupon);
      const coupon = await prisma.coupon.upsert({
        where: { code: data.code.toUpperCase() },
        update: { ...data, code: data.code.toUpperCase() },
        create: { ...data, code: data.code.toUpperCase() },
      });
      return NextResponse.json({ coupon });
    }

    if (body.action === "toggleCoupon") {
      const coupon = await prisma.coupon.findUniqueOrThrow({ where: { id: body.id } });
      const updated = await prisma.coupon.update({
        where: { id: body.id },
        data: { isActive: !coupon.isActive },
      });
      return NextResponse.json({ coupon: updated });
    }

    if (body.action === "upsertCategory") {
      const data = categorySchema.parse(body.category);
      const { id, ...rest } = data;
      const category = id
        ? await prisma.category.update({ where: { id }, data: rest })
        : await prisma.category.upsert({
            where: { slug: data.slug },
            update: rest,
            create: rest,
          });
      return NextResponse.json({ category });
    }

    if (body.action === "toggleCategory") {
      const cat = await prisma.category.findUniqueOrThrow({ where: { id: body.id } });
      const updated = await prisma.category.update({
        where: { id: body.id },
        data: { isActive: !cat.isActive },
      });
      return NextResponse.json({ category: updated });
    }

    if (body.action === "toggleUserBlock") {
      const u = await prisma.user.findUniqueOrThrow({ where: { id: body.id } });
      if (u.role === "ADMIN") return NextResponse.json({ error: "不能拉黑管理员" }, { status: 400 });
      const updated = await prisma.user.update({
        where: { id: body.id },
        data: { isBlocked: !u.isBlocked },
      });
      return NextResponse.json({ user: updated });
    }

    if (body.action === "setUserRole") {
      const updated = await prisma.user.update({
        where: { id: body.id },
        data: { role: body.role === "ADMIN" ? "ADMIN" : "USER" },
      });
      return NextResponse.json({ user: updated });
    }

    if (body.action === "manualFulfill") {
      const paid = await markOrderPaid(body.orderNo, `MANUAL${Date.now()}`);
      return NextResponse.json({ order: paid });
    }

    if (body.action === "cancelOrder") {
      const order = await cancelOrder(body.orderNo, "管理员取消");
      return NextResponse.json({ order });
    }

    if (body.action === "refundOrder") {
      const order = await prisma.order.findUniqueOrThrow({ where: { orderNo: body.orderNo } });
      if (!["PAID", "FULFILLED"].includes(order.status)) {
        return NextResponse.json({ error: "当前状态不可退款标记" }, { status: 400 });
      }
      const updated = await prisma.order.update({
        where: { orderNo: body.orderNo },
        data: {
          status: "REFUNDED",
          note: `${order.note || ""}\n退款标记：${body.reason || "管理员操作"}`.trim(),
        },
      });
      return NextResponse.json({ order: updated });
    }

    if (body.action === "updateDelivery") {
      const item = await prisma.orderItem.update({
        where: { id: body.itemId },
        data: { deliverySnapshot: body.deliverySnapshot },
      });
      return NextResponse.json({ item });
    }

    if (body.action === "setOrderStatus") {
      const order = await prisma.order.update({
        where: { orderNo: body.orderNo },
        data: { status: body.status },
      });
      return NextResponse.json({ order });
    }

    if (body.action === "updateSetting") {
      const setting = await prisma.siteSetting.upsert({
        where: { key: body.key },
        update: { value: String(body.value) },
        create: { key: body.key, value: String(body.value) },
      });
      return NextResponse.json({ setting });
    }

    if (body.action === "updateFeedback") {
      const status = ["NEW", "READ", "DONE"].includes(body.status) ? body.status : undefined;
      const data: { status?: string; adminNote?: string } = {};
      if (status) data.status = status;
      if (typeof body.adminNote === "string") data.adminNote = body.adminNote;
      const feedback = await prisma.feedback.update({
        where: { id: body.id },
        data,
      });
      return NextResponse.json({ feedback });
    }

    return NextResponse.json({ error: "unknown" }, { status: 400 });
  } catch (e) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const msg = e instanceof Error ? e.message : "失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
