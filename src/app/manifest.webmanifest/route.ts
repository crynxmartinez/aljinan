import { translations, getDirection } from '@/lib/i18n/translations'
export function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'ar'
  const t = translations[locale]
  return Response.json({
    id: '/', name: t.seo.rootTitle, short_name: 'Tasheel', description: t.seo.rootDescription,
    lang: locale, dir: getDirection(locale), start_url: '/', scope: '/', display: 'standalone',
    background_color: '#ffffff', theme_color: '#d97706',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
  }, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } })
}
