import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

export const metadata: Metadata = {
  title: "Aljinan - Client-Facing Operations Platform",
  description: "A shared workspace between service providers and clients",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aljinan",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
