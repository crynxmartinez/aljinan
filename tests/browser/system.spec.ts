import { test, expect } from '@playwright/test'
import { translations } from '../../src/lib/i18n/translations'
const roles = [
  { name: 'owner', root: '/dashboard', pages: ['/dashboard/clients', '/dashboard/work-orders', '/dashboard/analytics', '/dashboard/company', '/dashboard/team', '/dashboard/settings', '/dashboard/templates', '/dashboard/notifications'], branch: '/dashboard/clients/browser-client/branches/browser-branch' },
  { name: 'admin', root: '/admin', pages: ['/admin/contractors', '/admin/messages', '/admin/analytics', '/admin/settings', '/admin/settings/admins', '/admin/backfill-work-order-numbers', '/admin/generate-slugs'] },
  { name: 'client', root: '/portal', pages: ['/portal/work-orders', '/portal/settings', '/portal/notifications', '/portal/archived'] },
  { name: 'technician', root: '/dashboard', pages: ['/dashboard/work-orders', '/dashboard/profile'], branch: '/dashboard/clients/browser-client/branches/browser-branch' },
  { name: 'supervisor', root: '/dashboard', pages: ['/dashboard/work-orders', '/dashboard/profile'], branch: '/dashboard/clients/browser-client/branches/browser-branch' },
]
for (const role of roles) test(`${role.name}: language, theme, navigation and branch tabs`, async ({ page, context }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await context.addCookies([{ name: 'tasheel_locale', value: 'en', domain: 'localhost', path: '/' }])
  await page.goto('/login')
  await page.locator('#email').fill(`browser-${role.name}@tasheel.local`)
  await page.locator('#password').fill('BrowserOnly123!')
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(new RegExp(`${role.root}$`))
  let branch = role.branch
  if (role.name === 'client') branch = await page.locator('a[href^="/portal/branches/"]').first().getAttribute('href') ?? undefined
  for (const locale of ['en', 'ar'] as const) {
    await page.getByRole('button', { name: /^(English|العربية|EN|AR)$/ }).click()
    await page.getByRole('menuitem', { name: locale === 'en' ? /English/ : /العربية/ }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    for (const route of [role.root, ...role.pages, ...(branch ? [branch] : [])]) {
      const response = await page.goto(route)
      expect(response?.status(), route).toBeLessThan(400)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('main')).not.toContainText('Application error')
    }
    if (branch) {
      const tabs = page.getByRole('tab')
      const count = await tabs.count()
      expect(count).toBeGreaterThan(3)
      const first = await tabs.nth(0).boundingBox(), second = await tabs.nth(1).boundingBox()
      expect(first && second).toBeTruthy()
      expect(locale === 'ar' ? first!.x > second!.x : first!.x < second!.x).toBe(true)
      for (let i = 0; i < count; i++) { await tabs.nth(i).click(); await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true') }
    }
    if (role.name === 'owner' || role.name === 'client') {
      const response = await context.request.get('/api/work-orders')
      expect(response.ok()).toBe(true)
      const orders = await response.json()
      expect(orders.length).toBeGreaterThan(0)
      await page.getByRole('button', { name: translations[locale].common.switchToDarkMode }).click()
      const printPage = await context.newPage()
      await printPage.goto(`/print/work-orders/${orders[0].id}`)
      await expect(printPage.locator('.print-container')).toBeVisible()
      const pdf = await printPage.pdf({ path: testInfo.outputPath(`${locale}-work-order.pdf`), format: 'A4', printBackground: true })
      expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1)
      await printPage.close()
      await page.getByRole('button', { name: translations[locale].common.switchToLightMode }).click()
      await page.goto(branch ?? role.root)
    }
    for (const theme of ['dark', 'light'] as const) {
      const button = page.getByRole('button', { name: theme === 'dark' ? translations[locale].common.switchToDarkMode : translations[locale].common.switchToLightMode })
      await button.click()
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /light/)
      await page.screenshot({ path: testInfo.outputPath(`${locale}-${theme}-desktop.png`), fullPage: true, animations: 'disabled' })
      await page.setViewportSize({ width: 390, height: 844 })
      const trigger = page.locator('[data-sidebar-trigger]')
      await trigger.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath(`${locale}-${theme}-mobile.png`), animations: 'disabled' })
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await expect(trigger).toBeFocused()
      await page.setViewportSize({ width: 1280, height: 900 })
    }
  }
  expect(errors).toEqual([])
})

test('public pages and install manifest follow the selected language', async ({ page, context }, testInfo) => {
  for (const locale of ['en', 'ar'] as const) {
    await context.addCookies([{ name: 'tasheel_locale', value: locale, domain: 'localhost', path: '/' }])
    for (const route of ['/', '/features', '/about', '/contact', '/faq', '/privacy', '/terms', '/download', '/install', '/login', '/forgot-password', '/reset-password', '/verify-email']) {
      const response = await page.goto(route)
      expect(response?.status(), route).toBeLessThan(400)
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      await expect(page.locator('body')).not.toContainText('Application error')
    }
    const manifest = await context.request.get(`/manifest.webmanifest?lang=${locale}`)
    expect(await manifest.json()).toMatchObject({ lang: locale, dir: locale === 'ar' ? 'rtl' : 'ltr', id: '/' })
    await page.goto('/login')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: testInfo.outputPath(`${locale}-login-mobile.png`), animations: 'disabled' })
  }
})
