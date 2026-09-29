import type { Metadata } from "next";
import { Noto_Serif_SC, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { StoreChrome } from "@/components/store-chrome";
import "./globals.css";

const display = Noto_Serif_SC({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "研栈 · 考研资料平台",
    template: "%s · 研栈",
  },
  description: "考研真题、笔记、院校信息免费领取，三网盘任选下载。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${body.variable} h-full`}>
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
