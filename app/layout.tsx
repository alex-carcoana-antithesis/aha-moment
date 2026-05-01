import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import SiteHeader from "@/components/site-header";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antithesis — Release with certainty",
  description: "Bug-free systems, unlimited velocity: Unleash your agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-black text-foreground">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[700px] bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(139,92,246,0.04),rgba(76,29,149,0.02)_45%,transparent_75%)]"
        />
        <div
          aria-hidden
          className="flex justify-center items-center flex-col pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(124,58,237,0.04),transparent_70%)]"
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
