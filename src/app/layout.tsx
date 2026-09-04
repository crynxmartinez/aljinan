import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { TranslationProvider } from "@/lib/i18n/use-translation";
import { getLocale, getTranslationsForLocale } from "@/lib/i18n/server";
import { getDirection } from "@/lib/i18n/translations";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { Toaster } from 'sonner';
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslationsForLocale(locale).seo;
  const baseUrl = 'https://tasheel.sa';

  return {
    metadataBase: new URL(baseUrl),
    title: t.rootTitle,
    description: t.rootDescription,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Tasheel",
    },
    alternates: {
      canonical: baseUrl,
      // This app serves both languages from the same URL (chosen via cookie), not
      // separate /en and /ar paths — so these are self-referencing rather than the
      // distinct-URL-per-language hreflang setup search engines index most reliably.
      languages: {
        ar: baseUrl,
        en: baseUrl,
      },
    },
  };
}

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
    <html lang={locale} dir={getDirection(locale)}>
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
