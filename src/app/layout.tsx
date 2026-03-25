import type { Metadata } from "next";
import { Noto_Sans_SC, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vimlypond - Modal Music Notation Editor",
  description: "A Vim-inspired modal music notation editor with LilyPond syntax concepts, smart octave inference and VexFlow real-time rendering.",
  keywords: ["Vimlypond", "music notation", "VexFlow", "LilyPond", "Vim", "modal editor"],
  authors: [{ name: "Vimlypond Team" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${notoSansSC.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        {/* 加载 VexFlow */}
        <Script
          src="https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
