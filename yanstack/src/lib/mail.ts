import nodemailer from "nodemailer";

function smtpReady() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!smtpReady()) {
    console.info("[mail-stub]", input.subject, "->", input.to, "\n", input.text);
    return { sent: false, reason: "smtp-not-configured" as const };
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html || `<pre style="font-family:sans-serif">${input.text}</pre>`,
  });

  return { sent: true as const };
}

export async function sendVerificationEmail(to: string, code: string) {
  const site = process.env.NEXT_PUBLIC_SITE_NAME || "研栈";
  return sendMail({
    to,
    subject: `【${site}】邮箱验证码 ${code}`,
    text: `你的验证码是 ${code}，10 分钟内有效。如非本人操作请忽略。`,
    html: `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#0c2340">
        <p>你好，</p>
        <p>你正在注册 <strong>${site}</strong> 账号，验证码为：</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
        <p>10 分钟内有效。如非本人操作，请忽略本邮件。</p>
      </div>
    `,
  });
}

/**
 * 发货通知邮件（需配置 SMTP_*）
 * 未配置时仅打日志，不阻断发货。
 */
export async function sendFulfillmentEmail(input: {
  to?: string | null;
  orderNo: string;
  titles: string[];
}) {
  if (!input.to) return { sent: false, reason: "no-email" as const };
  const site = process.env.NEXT_PUBLIC_SITE_NAME || "研栈";
  return sendMail({
    to: input.to,
    subject: `【${site}】订单 ${input.orderNo} 交付通知`,
    text: `订单 ${input.orderNo} 已交付：\n${input.titles.map((t) => `- ${t}`).join("\n")}\n请登录网站查看下载链接。`,
  });
}
