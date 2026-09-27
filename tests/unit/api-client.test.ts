import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
import { api, ApiError } from '@/lib/api-client'
import { systemMessages } from '@/lib/i18n/system-messages'

afterEach(() => vi.unstubAllGlobals())
describe('public API failure contract', () => {
  it('uses the current language and never echoes raw server details', async () => {
    vi.stubGlobal('document', { documentElement: { lang: 'en' } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Sensitive backend details' }), { status: 403 })))
    await expect(api.get('/test')).rejects.toMatchObject({ message: systemMessages.en.forbidden, status: 403 })
    vi.stubGlobal('document', { documentElement: { lang: 'ar' } })
    await expect(api.get('/test')).rejects.toMatchObject({ message: systemMessages.ar.forbidden })
  })
  it('does not treat malformed successful JSON as saved data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>proxy failure</html>')))
    await expect(api.get('/test')).rejects.toBeInstanceOf(ApiError)
  })
  it('accepts an explicit no-content response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    expect(await api.delete('/test')).toBeUndefined()
  })
  it('localizes transport failures', async () => {
    vi.stubGlobal('document', { documentElement: { lang: 'en' } })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket detail')))
    await expect(api.get('/test')).rejects.toMatchObject({ message: systemMessages.en.networkError, status: 0 })
  })
})
