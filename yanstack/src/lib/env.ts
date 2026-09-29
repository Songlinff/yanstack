import fs from "node:fs";
import path from "node:path";

/**
 * 站点对外地址（用于支付 return/notify URL、sitemap 等）。
 *
 * 注意：Next.js 会把 NEXT_PUBLIC_* 变量在构建时内联进 bundle，
 * 用 Cloudflare 免费隧道这类「每次启动域名都会变」的场景下没法改。
 * 因此这里做成运行时读取，优先级：
 *   1. 仓库根 .tunnel-url（隧道脚本每次启动写入当前随机域名）
 *   2. APP_URL 环境变量
 *   3. 构建时的 NEXT_PUBLIC_APP_URL
 *   4. 本地回退
 */
function readTunnelUrl(): string | null {
  try {
    const file = path.join(process.cwd(), ".tunnel-url");
    const value = fs.readFileSync(file, "utf8").trim();
    if (/^https?:\/\/[^\s]+$/.test(value)) return value;
  } catch {
    // 未启用隧道时忽略
  }
  return null;
}

export function getAppUrl(): string {
  return (
    readTunnelUrl() ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}
