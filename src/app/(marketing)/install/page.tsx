'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { Download, Monitor, Smartphone, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/use-translation'

export const metadata: Metadata = {
  title: 'Install Tasheel | Desktop App',
  description: 'Install Tasheel desktop app for Windows and Linux. Mobile apps coming soon.',
}

export default function InstallPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t.pages.install.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.pages.install.subtitle}
          </p>
        </div>

        {/* Desktop Apps - Available */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Desktop Apps</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Windows */}
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Monitor className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.pages.install.windows}</h3>
              <p className="text-muted-foreground mb-6">
                {t.pages.install.windowsDesc}
              </p>
              <Button size="lg" className="w-full gap-2" asChild>
                <a href="https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/downloads/tasheel-windows.exe" download>
                  <Download className="h-5 w-5" />
                  {t.pages.install.downloadForWindows}
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                {t.pages.install.windowsRequirements}
              </p>
            </div>

            {/* Linux */}
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.pages.install.linux}</h3>
              <p className="text-muted-foreground mb-6">
                {t.pages.install.linuxDesc}
              </p>
              <Button size="lg" variant="outline" className="w-full gap-2" disabled>
                <Download className="h-5 w-5" />
                {t.pages.install.appImage}
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" disabled>
                <Download className="h-5 w-5" />
                {t.pages.install.debPackage}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {t.pages.install.comingSoon}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                {t.pages.install.linuxRequirements}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Apps - Coming Soon */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Mobile Apps</h2>
          
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-200 rounded-full">
                <Smartphone className="h-10 w-10 text-slate-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">{t.pages.install.mobileComingSoon}</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
              {t.pages.install.mobileDesc}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{t.pages.install.inDevelopment}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Features */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-bold mb-6">{t.pages.install.whyInstall}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">{t.pages.install.quickAccess}</h3>
              <p className="text-sm text-muted-foreground">{t.pages.install.quickAccessDesc}</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold mb-2">{t.pages.install.stayLoggedIn}</h3>
              <p className="text-sm text-muted-foreground">{t.pages.install.stayLoggedInDesc}</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💻</div>
              <h3 className="font-semibold mb-1">{t.pages.install.nativeExperience}</h3>
              <p className="text-sm text-muted-foreground">{t.pages.install.nativeExperienceDesc}</p>
            </div>
          </div>
        </div>

        {/* Web Access Alternative */}
        <div className="max-w-3xl mx-auto text-center bg-slate-100 rounded-lg p-8">
          <h3 className="text-lg font-semibold mb-2">{t.pages.install.preferWeb}</h3>
          <p className="text-muted-foreground mb-4">{t.pages.install.preferWebDesc}</p>
          <Button variant="outline" asChild>
            <Link href="/">{t.pages.install.useWebVersion}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
