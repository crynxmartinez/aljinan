'use client'

import Link from 'next/link'
import { Logo } from './logo'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-translation'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Logo size="md" clickable={false} className="mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {t.common.tagline}
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@tasheel.sa" className="hover:text-foreground">
                  {t.footer.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+966501234567" className="hover:text-foreground">
                  {t.footer.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{t.footer.location}</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.product}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/features" className="hover:text-foreground">
                  {t.footer.features}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  {t.footer.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.company}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  {t.footer.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  {t.footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  {t.footer.termsOfService}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <p>{t.footer.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
            <span className="hidden md:inline text-muted-foreground">•</span>
            <p>
              {t.footer.poweredBy}{' '}
              <a 
                href="https://www.jinanagency.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {t.footer.jinanAgency}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
