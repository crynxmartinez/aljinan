import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationSchema } from "@/components/seo/organization-schema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasheel - Safety Contractor Management Platform",
  description: "Complete safety management platform for contractors in Saudi Arabia",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tasheel",
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
      <head>
        <OrganizationSchema />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
