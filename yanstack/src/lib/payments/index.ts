import type { PaymentChannel } from "@/lib/types";
import type { PaymentGateway } from "./types";
import { mockGateway } from "./mock";
import { epayGateway } from "./epay";

export function getGateway(channel: PaymentChannel): PaymentGateway {
  switch (channel) {
    case "MOCK":
      return mockGateway;
    case "EPAY":
    case "ALIPAY":
    case "WECHAT":
      // 国内支付宝/微信：优先走易支付聚合；官方密钥未填时仍走 EPAY 配置
      if (process.env.EPAY_PID && process.env.EPAY_KEY && process.env.EPAY_API_URL) {
        return {
          ...epayGateway,
          channel,
        };
      }
      if (channel === "ALIPAY" || channel === "WECHAT") {
        // 未配置时回退说明，下单接口会捕获
        return epayGateway;
      }
      return epayGateway;
    default:
      return mockGateway;
  }
}

export function availableChannels(): Array<{
  id: PaymentChannel;
  label: string;
  ready: boolean;
  hint: string;
}> {
  const epayReady = Boolean(
    process.env.EPAY_API_URL && process.env.EPAY_PID && process.env.EPAY_KEY,
  );
  return [
    {
      id: "MOCK",
      label: "模拟支付（演示）",
      ready: true,
      hint: "本地演示即时到账并发货",
    },
    {
      id: "ALIPAY",
      label: "支付宝",
      ready: epayReady,
      hint: epayReady ? "经易支付跳转支付宝" : "需配置 EPAY_* 或官方支付宝密钥",
    },
    {
      id: "WECHAT",
      label: "微信支付",
      ready: epayReady,
      hint: epayReady ? "经易支付跳转微信" : "需配置 EPAY_* 或微信商户号",
    },
    {
      id: "EPAY",
      label: "易支付收银台",
      ready: epayReady,
      hint: epayReady ? "已配置" : "填写 EPAY_API_URL / EPAY_PID / EPAY_KEY",
    },
  ];
}

export { mockGateway, epayGateway };
