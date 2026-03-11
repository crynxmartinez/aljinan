'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { Download, Smartphone, Monitor, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'

export const metadata: Metadata = {
  title: 'Download Tasheel App | Mobile & Desktop',
  description: 'Download Tasheel app for Android, Windows, and Linux. Install the safety management platform on your device.',
}

export default function DownloadPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t.pages.download.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.pages.download.subtitle}
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {/* Android */}
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-full">
                <Smartphone className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.pages.download.android}</h2>
            <p className="text-muted-foreground mb-6">{t.pages.download.androidDesc}</p>
            <Button size="lg" className="w-full gap-2" asChild>
              <a href="https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/downloads/tasheel-android.apk" download>
                <Download className="h-5 w-5" />
                {t.pages.download.downloadApk}
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Version 1.0.0 • ~10 MB
            </p>
          </div>

          {/* Windows */}
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.pages.download.windows}</h2>
            <p className="text-muted-foreground mb-6">{t.pages.download.windowsDesc}</p>
            <Button size="lg" className="w-full gap-2" asChild>
              <a href="https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/downloads/tasheel-windows.exe" download>
                <Download className="h-5 w-5" />
                {t.pages.download.downloadExe}
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Version 1.0.0 • ~80 MB
            </p>
          </div>

          {/* Linux */}
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.pages.download.linux}</h2>
            <p className="text-muted-foreground mb-6">{t.pages.download.linuxDesc}</p>
            <div className="space-y-2">
              <Button size="lg" variant="outline" className="w-full gap-2" asChild>
                <a href="https://your-aws-bucket.s3.amazonaws.com/downloads/tasheel-linux.AppImage" download>
                  <Download className="h-5 w-5" />
                  AppImage
                </a>
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" asChild>
                <a href="https://your-aws-bucket.s3.amazonaws.com/downloads/tasheel-linux.deb" download>
                  <Download className="h-5 w-5" />
                  DEB Package
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Version 1.0.0 • ~80 MB
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">{t.pages.download.whyInstall}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">{t.pages.download.quickAccess}</h3>
              <p className="text-sm text-muted-foreground">{t.pages.download.quickAccessDesc}</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold mb-2">{t.pages.download.stayLoggedIn}</h3>
              <p className="text-sm text-muted-foreground">
                {t.pages.download.stayLoggedInDesc}
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-semibold mb-1">{t.pages.download.appExperience}</h3>
              <p className="text-sm text-muted-foreground">{t.pages.download.appExperienceDesc}</p>
            </div>
          </div>
        </div>

        {/* Web Access */}
        <div className="max-w-3xl mx-auto mt-16 text-center bg-slate-100 rounded-lg p-8">
          <h3 className="text-lg font-semibold mb-2">{t.pages.download.preferWeb}</h3>
          <p className="text-muted-foreground mb-4">
            {t.pages.download.preferWebDesc}
          </p>
          <Button variant="outline" asChild>
            <Link href="/">{t.pages.download.goToWebApp}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
