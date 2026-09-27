import { describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ committed: [] as string[] }))
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: async (operation: (db: { write: (value: string) => void }) => Promise<unknown>) => {
  const pending: string[] = []
  const result = await operation({ write: value => pending.push(value) })
  state.committed.push(...pending)
  return result
} } }))
import { atomicMutation } from '@/lib/atomic-mutation'

describe('business mutation and inbox commit boundary', () => {
  it('rolls back when a handler catches a persistence error and returns failure', async () => {
    state.committed = []
    const response = await atomicMutation(async db => {
      // Test double represents both kinds of database writes in this transaction.
      ;(db as unknown as { write: (value: string) => void }).write('business action')
      return Response.json({ error: 'notification failed' }, { status: 500 })
    })
    expect(response.status).toBe(500)
    expect(state.committed).toEqual([])
  })
  it('commits successful business and notification writes together', async () => {
    state.committed = []
    await atomicMutation(async db => {
      const tx = db as unknown as { write: (value: string) => void }
      tx.write('business action'); tx.write('notification')
      return Response.json({ success: true })
    })
    expect(state.committed).toEqual(['business action', 'notification'])
  })
})
