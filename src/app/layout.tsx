import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { TranslationProvider } from "@/lib/i18n/use-translation";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://tasheel.sa'),
  title: "Tasheel - Safety Contractor Management Platform",
  description: "Complete safety management platform for contractors in Saudi Arabia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tasheel",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
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
        <TranslationProvider>
          <SessionProvider>
            <ImpersonationBanner />
            {children}
          </SessionProvider>
          <Toaster position="top-right" richColors />
          <RegisterServiceWorker />
          <Analytics />
          <SpeedInsights />
        </TranslationProvider>
      </body>
    </html>
  );
}
