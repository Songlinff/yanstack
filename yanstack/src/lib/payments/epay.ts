import crypto from "crypto";
import type { PaymentGateway, PayRequest, PayCreateResult } from "./types";

/**
 * 易支付 / 彩虹易支付兼容网关（需填写 EPAY_*）
 * 参考异次元发卡与独角数卡的聚合支付插件思路
 */
function sign(params: Record<string, string>, key: string) {
  const str = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "" && k !== "sign" && k !== "sign_type")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("md5").update(str + key).digest("hex");
}

export const epayGateway: PaymentGateway = {
  channel: "EPAY",
  async createPayment(req: PayRequest): Promise<PayCreateResult> {
    const api = process.env.EPAY_API_URL;
    const pid = process.env.EPAY_PID;
    const key = process.env.EPAY_KEY;
    if (!api || !pid || !key) {
      throw new Error("易支付未配置：请填写 EPAY_API_URL / EPAY_PID / EPAY_KEY");
    }

    const type = req.channel === "WECHAT" ? "wxpay" : "alipay";
    const params: Record<string, string> = {
      pid,
      type,
      out_trade_no: req.orderNo,
      notify_url: req.notifyUrl,
      return_url: req.returnUrl,
      name: req.subject.slice(0, 60),
      money: (req.amountCents / 100).toFixed(2),
    };
    params.sign = sign(params, key);
    params.sign_type = "MD5";

    const qs = new URLSearchParams(params).toString();
    const base = api.replace(/\/$/, "");
    return {
      mode: "redirect",
      payUrl: `${base}/submit.php?${qs}`,
      message: "即将跳转易支付收银台",
    };
  },
  async verifyNotify(payload) {
    const key = process.env.EPAY_KEY;
    if (!key) return { ok: false };
    const expected = sign(payload, key);
    if (expected !== payload.sign) return { ok: false };
    if (payload.trade_status !== "TRADE_SUCCESS" && payload.trade_status !== "TRADE_FINISHED") {
      return { ok: false };
    }
    return {
      ok: true,
      orderNo: payload.out_trade_no,
      tradeNo: payload.trade_no,
    };
  },
};
