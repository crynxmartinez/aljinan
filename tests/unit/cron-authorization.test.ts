import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
import { GET, POST } from '@/app/api/equipment/check-expiry/route'
import { GET as archive } from '@/app/api/cron/auto-archive/route'
import { NextRequest } from 'next/server'
afterEach(() => vi.unstubAllEnvs())
describe('scheduled job authorization', () => {
  for (const [name, handler] of [['equipment GET', GET], ['equipment POST', POST], ['archive', archive]] as const) {
    it(`${name} refuses an unconfigured secret, including a literal undefined bearer`, async () => {
      vi.stubEnv('CRON_SECRET', '')
      for (const authorization of ['', 'Bearer undefined', 'Bearer ']) {
        const response = await handler(new NextRequest('http://localhost/api/cron', { headers: { authorization } }))
        expect(response.status).toBe(401)
      }
    })
  }
})
