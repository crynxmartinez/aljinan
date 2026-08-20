import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { TranslationProvider } from "@/lib/i18n/use-translation";
import { getLocale } from "@/lib/i18n/server";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://tasheel.sa'),
  title: "تسهيل - منصة إدارة مقاولات السلامة",
  description: "منصة متكاملة لإدارة السلامة للمقاولين في المملكة العربية السعودية",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <OrganizationSchema />
      </head>
      <body className="antialiased">
        <TranslationProvider initialLocale={locale}>
          <SessionProvider>
            <ImpersonationBanner />
            {children}
          </SessionProvider>
          <Toaster position="top-left" richColors />
          <Analytics />
          <SpeedInsights />
        </TranslationProvider>
      </body>
    </html>
  );
}
