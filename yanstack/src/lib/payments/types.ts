import type { PaymentChannel } from "@/lib/types";

export type PayRequest = {
  orderNo: string;
  amountCents: number;
  subject: string;
  returnUrl: string;
  notifyUrl: string;
  channel: PaymentChannel;
};

export type PayCreateResult = {
  mode: "redirect" | "qrcode" | "instant";
  payUrl?: string;
  qrContent?: string;
  message?: string;
  tradeNo?: string;
};

export interface PaymentGateway {
  channel: PaymentChannel;
  createPayment(req: PayRequest): Promise<PayCreateResult>;
  verifyNotify(payload: Record<string, string>): Promise<{
    ok: boolean;
    orderNo?: string;
    tradeNo?: string;
  }>;
}
