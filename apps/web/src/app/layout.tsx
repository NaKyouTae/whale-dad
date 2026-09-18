import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "whale-dad",
  description: "고래 아빠를 위하여",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15181c" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

/**
 * 첫 페인트 전에 테마를 정한다. 이 스크립트가 없으면 저장된 테마가 적용되기 전에
 * 기본 화면이 한 번 깜빡인다. 기본값은 다크.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("whale-dad-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Pretendard — 필요한 한글 서브셋만 내려받는 dynamic subset */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="min-h-dvh bg-surface antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
