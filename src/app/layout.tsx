import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TranslationProvider } from "@/lib/i18n/use-translation";
import { getLocale, getTranslationsForLocale } from "@/lib/i18n/server";
import { getDirection } from "@/lib/i18n/translations";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { LocalizedToaster } from '@/components/localized-toaster';
import { displayFont } from "@/lib/fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslationsForLocale(locale).seo;
  const baseUrl = 'https://tasheel.sa';

  return {
    metadataBase: new URL(baseUrl),
    title: t.rootTitle,
    description: t.rootDescription,
    manifest: `/manifest.webmanifest?lang=${locale}`,
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d97706" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <OrganizationSchema />
      </head>
      <body className={`antialiased ${displayFont.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <TranslationProvider initialLocale={locale}>
            <SessionProvider>
              <ImpersonationBanner />
              {children}
            </SessionProvider>
            <LocalizedToaster />
            <Analytics />
            <SpeedInsights />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
