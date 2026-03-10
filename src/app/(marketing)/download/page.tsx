import { Metadata } from 'next'
import Link from 'next/link'
import { Download, Smartphone, Monitor, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Download Tasheel App | Mobile & Desktop',
  description: 'Download Tasheel app for Android, Windows, and Linux. Install the safety management platform on your device.',
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Download Tasheel
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Install Tasheel on your device for quick access to your safety management dashboard
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
            <h2 className="text-2xl font-bold mb-2">Android</h2>
            <p className="text-muted-foreground mb-6">
              Download APK for Android devices
            </p>
            <Button size="lg" className="w-full gap-2" asChild>
              <a href="https://your-aws-bucket.s3.amazonaws.com/downloads/tasheel-android.apk" download>
                <Download className="h-5 w-5" />
                Download APK
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
            <h2 className="text-2xl font-bold mb-2">Windows</h2>
            <p className="text-muted-foreground mb-6">
              Download installer for Windows PC
            </p>
            <Button size="lg" className="w-full gap-2" asChild>
              <a href="https://your-aws-bucket.s3.amazonaws.com/downloads/tasheel-windows.exe" download>
                <Download className="h-5 w-5" />
                Download EXE
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
            <h2 className="text-2xl font-bold mb-2">Linux</h2>
            <p className="text-muted-foreground mb-6">
              Download for Linux distributions
            </p>
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

        {/* Installation Instructions */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Installation Instructions</h2>
          
          <div className="space-y-6">
            {/* Android */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                Android Installation
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Download the APK file to your Android device</li>
                <li>Open the downloaded file</li>
                <li>If prompted, enable "Install from Unknown Sources" in Settings</li>
                <li>Tap "Install" and wait for installation to complete</li>
                <li>Open Tasheel app from your app drawer</li>
              </ol>
            </div>

            {/* Windows */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Windows Installation
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Download the EXE installer</li>
                <li>Run the installer (double-click the file)</li>
                <li>Follow the installation wizard</li>
                <li>Choose installation directory (or use default)</li>
                <li>Launch Tasheel from Desktop shortcut or Start Menu</li>
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
                  <p className="font-medium mb-2">AppImage:</p>
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
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Why Install Tasheel?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold mb-2">Quick Access</h3>
              <p className="text-sm text-muted-foreground">
                Launch Tasheel instantly from your device
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
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-semibold mb-2">App Experience</h3>
              <p className="text-sm text-muted-foreground">
                Native app feel on all your devices
              </p>
            </div>
          </div>
        </div>

        {/* Web Access */}
        <div className="max-w-3xl mx-auto mt-16 text-center bg-slate-100 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-2">Prefer Web Access?</h3>
          <p className="text-muted-foreground mb-4">
            You can also access Tasheel directly from your browser
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Go to Web App</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
