import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { StoreChrome } from "@/components/store-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "研栈 · 考研资料平台",
    template: "%s · 研栈",
  },
  description: "考研真题、笔记、院校信息免费领取，夸克网盘下载。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
        >
          跳到主要内容
        </a>
        <Providers>
          <StoreChrome>{children}</StoreChrome>
        </Providers>
      </body>
    </html>
  );
}
