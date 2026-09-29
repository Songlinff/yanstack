import type { PaymentGateway, PayRequest, PayCreateResult } from "./types";

/** 本地演示：创建后直接可确认支付，无需真实商户号 */
export const mockGateway: PaymentGateway = {
  channel: "MOCK",
  async createPayment(req: PayRequest): Promise<PayCreateResult> {
    const tradeNo = `MOCK${Date.now()}`;
    return {
      mode: "instant",
      tradeNo,
      message: "模拟支付已就绪，点击确认即完成付款并发货。",
      payUrl: `${req.returnUrl}?mock=1&tradeNo=${tradeNo}&orderNo=${req.orderNo}`,
    };
  },
  async verifyNotify(payload) {
    if (!payload.orderNo) return { ok: false };
    return { ok: true, orderNo: payload.orderNo, tradeNo: payload.tradeNo || `MOCK${Date.now()}` };
  },
};
