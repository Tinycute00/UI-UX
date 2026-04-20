import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "工務所管理系統",
    template: "%s｜工務所管理系統",
  },
  description:
    "公共工程甲級營造廠工務所前端管理系統 — 50-70 歲友善設計、離線優先、電子化送審",
  applicationName: "工務所管理系統",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body className="min-h-dvh bg-surface-muted text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
