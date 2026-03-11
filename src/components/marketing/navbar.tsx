'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { InstallPWAButton } from '@/components/pwa/install-pwa-button'
import { LanguageToggle } from '@/components/language-toggle'
import { useTranslation } from '@/lib/i18n/use-translation'
import { cn } from '@/lib/utils'

interface NavbarProps {
  variant?: 'marketing' | 'auth'
  showHomeButton?: boolean
}

export function Navbar({ variant = 'marketing', showHomeButton = false }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()

  const navLinks = [
    { href: '/features', label: t.navbar.features },
    { href: '/about', label: t.navbar.about },
    { href: '/contact', label: t.navbar.contact },
  ]

  if (variant === 'auth') {
    return (
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {showHomeButton && (
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>←</span>
                <span>{t.navbar.home}</span>
              </Link>
            )}
            <Logo size="md" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle />
            <InstallPWAButton />
            <Button variant="ghost" asChild>
              <Link href="/login">{t.navbar.login}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t.navbar.signUp}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary px-4 py-2',
                    pathname === link.href
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <LanguageToggle />
                  <InstallPWAButton />
                </div>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/login">{t.navbar.login}</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">{t.navbar.signUp}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
