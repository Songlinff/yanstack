import { customAlphabet } from "nanoid";
import type { Prisma } from "@prisma/client";
import type { PaymentChannel } from "./types";
import { prisma } from "./prisma";
import { getGateway } from "./payments";
import { parseDelivery } from "./utils";
import { sendFulfillmentEmail } from "./mail";
import { getAppUrl } from "./env";

const orderNoGen = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 12);

export function genOrderNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `YS${ymd}${orderNoGen()}`;
}

export async function applyCoupon(code: string | undefined, subtotalCents: number) {
  if (!code) return { discountCents: 0, couponId: null as string | null, couponCode: null as string | null };
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new Error("优惠券无效");
  if (coupon.endsAt && coupon.endsAt < new Date()) throw new Error("优惠券已过期");
  if (coupon.usedCount >= coupon.maxUses) throw new Error("优惠券已用完");
  if (subtotalCents < coupon.minAmountCents) throw new Error("未达到优惠券最低消费");

  let discountCents = 0;
  if (coupon.discountType === "fixed") {
    discountCents = coupon.discountValue;
  } else if (coupon.discountType === "percent") {
    discountCents = Math.floor((subtotalCents * coupon.discountValue) / 100);
  }
  discountCents = Math.min(discountCents, subtotalCents);
  return { discountCents, couponId: coupon.id, couponCode: coupon.code };
}

type CartLine = { productId: string; quantity: number };

export async function createOrderFromCart(input: {
  lines: CartLine[];
  userId?: string;
  guestEmail?: string;
  guestContact?: string;
  couponCode?: string;
  paymentChannel: PaymentChannel;
  note?: string;
}) {
  if (!input.lines.length) throw new Error("购物车为空");

  const products = await prisma.product.findMany({
    where: {
      id: { in: input.lines.map((l) => l.productId) },
      isPublished: true,
    },
  });
  if (products.length !== input.lines.length) throw new Error("部分商品已下架");

  const lines = input.lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)!;
    if (p.stock === 0) throw new Error(`「${p.title}」已售罄`);
    if (p.stock > 0 && l.quantity > p.stock) {
      throw new Error(`「${p.title}」仅剩 ${p.stock} 份`);
    }
    return { product: p, quantity: Math.max(1, Math.min(20, l.quantity)) };
  });

  const channelReady = (() => {
    if (input.paymentChannel === "MOCK") return true;
    return Boolean(process.env.EPAY_API_URL && process.env.EPAY_PID && process.env.EPAY_KEY);
  })();
  if (!channelReady) throw new Error("所选支付方式尚未配置，请改用模拟支付或填写商户参数");

  const subtotalCents = lines.reduce((s, l) => s + l.product.priceCents * l.quantity, 0);
  const coupon = await applyCoupon(input.couponCode, subtotalCents);
  const totalCents = Math.max(0, subtotalCents - coupon.discountCents);
  const orderNo = genOrderNo();

  // 迭代1：下单不扣优惠券次数，支付成功再扣，避免未付款浪费名额
  return prisma.order.create({
    data: {
      orderNo,
      userId: input.userId,
      guestEmail: input.guestEmail?.toLowerCase(),
      guestContact: input.guestContact,
      status: "PENDING",
      subtotalCents,
      discountCents: coupon.discountCents,
      totalCents,
      couponId: coupon.couponId,
      couponCode: coupon.couponCode,
      paymentChannel: input.paymentChannel,
      note: input.note,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          title: l.product.title,
          unitPriceCents: l.product.priceCents,
          quantity: l.quantity,
        })),
      },
      payments: {
        create: {
          channel: input.paymentChannel,
          amountCents: totalCents,
          status: "pending",
        },
      },
    },
    include: { items: true, payments: true },
  });
}

export async function cancelOrder(orderNo: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "PENDING") throw new Error("仅待支付订单可取消");
  return prisma.order.update({
    where: { orderNo },
    data: {
      status: "CANCELLED",
      note: reason ? `${order.note || ""}\n取消：${reason}`.trim() : order.note,
    },
  });
}

export async function markOrderPaid(orderNo: string, tradeNo?: string) {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: { include: { product: true } }, user: true },
  });
  if (!order) throw new Error("订单不存在");
  if (order.status === "PAID" || order.status === "FULFILLED") return order;
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    throw new Error("订单不可支付");
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = item.product;
      if (product.stock >= 0) {
        const fresh = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
        if (fresh.stock < item.quantity) throw new Error(`库存不足：${product.title}`);
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      await tx.orderItem.update({
        where: { id: item.id },
        data: { deliverySnapshot: product.deliveryPayload },
      });
    }

    await tx.payment.updateMany({
      where: { orderId: order.id, status: "pending" },
      data: { status: "success", tradeNo: tradeNo || null },
    });

    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "FULFILLED",
        paidAt: new Date(),
        fulfilledAt: new Date(),
      },
      include: { items: true, payments: true },
    });
  });

  await sendFulfillmentEmail({
    to: order.guestEmail || order.user?.email,
    orderNo: order.orderNo,
    titles: order.items.map((i) => i.title),
  });
  return updated;
}

export async function startPayment(orderNo: string) {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true },
  });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "PENDING") throw new Error("订单状态不可支付");

  const appUrl = getAppUrl();
  const gateway = getGateway(order.paymentChannel as PaymentChannel);
  return gateway.createPayment({
    orderNo: order.orderNo,
    amountCents: order.totalCents,
    subject: order.items.map((i) => i.title).join(" / ").slice(0, 80) || "研栈资料",
    returnUrl: `${appUrl}/orders/${order.orderNo}`,
    notifyUrl: `${appUrl}/api/pay/notify`,
    channel: order.paymentChannel as PaymentChannel,
  });
}

export function canViewDelivery(opts: {
  orderUserId: string | null;
  guestEmail: string | null;
  sessionUserId?: string | null;
  sessionEmail?: string | null;
  unlockEmail?: string | null;
  isAdmin?: boolean;
}) {
  if (opts.isAdmin) return true;
  if (opts.sessionUserId && opts.orderUserId && opts.sessionUserId === opts.orderUserId) return true;
  const guest = opts.guestEmail?.toLowerCase();
  if (!guest) return Boolean(opts.sessionUserId && opts.orderUserId === opts.sessionUserId);
  if (opts.sessionEmail && opts.sessionEmail.toLowerCase() === guest) return true;
  if (opts.unlockEmail && opts.unlockEmail.toLowerCase() === guest) return true;
  return false;
}

export function serializeOrderDelivery(items: Array<{ deliverySnapshot: string | null; title: string }>) {
  return items.map((item) => ({
    title: item.title,
    delivery: item.deliverySnapshot ? parseDelivery(item.deliverySnapshot) : null,
  }));
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  FULFILLED: "已发货",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
};

export const PAY_CHANNEL_LABEL: Record<string, string> = {
  MOCK: "模拟支付",
  ALIPAY: "支付宝",
  WECHAT: "微信支付",
  EPAY: "易支付",
};

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true; payments: true };
}>;
