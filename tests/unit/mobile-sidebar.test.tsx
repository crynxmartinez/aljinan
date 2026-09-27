// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranslationProvider, useTranslation } from '@/lib/i18n/use-translation'
import { MobileSidebarProvider } from '@/components/layout/mobile-sidebar-context'
import { MobileMenuButton } from '@/components/layout/mobile-menu-button'
import { SidebarShell } from '@/components/layout/sidebar-shell'
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function Navigation() {
  const { t } = useTranslation()
  return <><MobileMenuButton /><SidebarShell><a href="/dashboard">{t.system.navigation}</a></SidebarShell><button>Outside</button></>
}
describe('mobile drawer keyboard behavior', () => {
  it.each(['en', 'ar'] as const)('unmounts closed links and restores focus after Escape in %s', async locale => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const user = userEvent.setup()
    render(<TranslationProvider initialLocale={locale}><MobileSidebarProvider><Navigation /></MobileSidebarProvider></TranslationProvider>)
    expect(screen.queryByRole('link')).toBeNull()
    const trigger = document.querySelector<HTMLButtonElement>('[data-sidebar-trigger]')!
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('link')).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(trigger)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
