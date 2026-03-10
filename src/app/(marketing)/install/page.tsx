import { Metadata } from 'next'
import Link from 'next/link'
import { Download, Monitor, Smartphone, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Install Tasheel | Desktop App',
  description: 'Install Tasheel desktop app for Windows and Linux. Mobile apps coming soon.',
}

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Install Tasheel
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download and install Tasheel on your desktop for quick access to your safety management dashboard
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
              <h3 className="text-2xl font-bold mb-2">Windows</h3>
              <p className="text-muted-foreground mb-6">
                Download installer for Windows PC
              </p>
              <Button size="lg" className="w-full gap-2" asChild>
                <a href="https://tasheel-uploads.s3.ap-southeast-1.amazonaws.com/downloads/tasheel-windows.exe" download>
                  <Download className="h-5 w-5" />
                  Download for Windows
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Windows 10 or later • ~170 MB
              </p>
            </div>

            {/* Linux */}
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Linux</h3>
              <p className="text-muted-foreground mb-6">
                Download for Linux distributions
              </p>
              <div className="space-y-2">
                <Button size="lg" variant="outline" className="w-full gap-2" disabled>
                  <Download className="h-5 w-5" />
                  AppImage
                </Button>
                <Button size="lg" variant="outline" className="w-full gap-2" disabled>
                  <Download className="h-5 w-5" />
                  DEB Package
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Coming soon - Build in progress
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Ubuntu, Debian, Fedora • ~80 MB
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
            <h3 className="text-2xl font-bold mb-3">Coming Soon</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
              Mobile apps for Android and iOS are currently in development and will be available soon.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>In Development</span>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">How to Install</h2>
          
          <div className="space-y-6">
            {/* Windows */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Windows Installation
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Download the Windows installer (EXE file)</li>
                <li>Run the installer by double-clicking the downloaded file</li>
                <li>Follow the installation wizard</li>
                <li>Choose installation directory or use the default location</li>
                <li>Launch Tasheel from Desktop shortcut or Start Menu</li>
                <li>Log in with your credentials - your session will be saved</li>
              </ol>
            </div>

            {/* Linux */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Linux Installation
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">AppImage (Universal):</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Download the AppImage file</li>
                    <li>Make it executable: <code className="bg-slate-100 px-2 py-1 rounded text-sm">chmod +x Tasheel-1.0.0.AppImage</code></li>
                    <li>Run: <code className="bg-slate-100 px-2 py-1 rounded text-sm">./Tasheel-1.0.0.AppImage</code></li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium mb-2">DEB Package (Ubuntu/Debian):</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Download the DEB file</li>
                    <li>Install: <code className="bg-slate-100 px-2 py-1 rounded text-sm">sudo dpkg -i tasheel_1.0.0_amd64.deb</code></li>
                    <li>Launch from applications menu</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Why Install Tasheel?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold mb-2">Quick Access</h3>
              <p className="text-sm text-muted-foreground">
                Launch Tasheel instantly from your desktop
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold mb-2">Stay Logged In</h3>
              <p className="text-sm text-muted-foreground">
                Your session persists between launches
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">💻</div>
              <h3 className="font-semibold mb-2">Native Experience</h3>
              <p className="text-sm text-muted-foreground">
                Desktop app feel with full functionality
              </p>
            </div>
          </div>
        </div>

        {/* Web Access Alternative */}
        <div className="max-w-3xl mx-auto text-center bg-slate-100 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-2">Prefer Web Access?</h3>
          <p className="text-muted-foreground mb-4">
            You can also access Tasheel directly from your browser without installing
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Use Web Version</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
