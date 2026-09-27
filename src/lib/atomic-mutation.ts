import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

export type MutationDatabase = Prisma.TransactionClient
export type Database = PrismaClient | MutationDatabase

class RollbackResponse extends Error {
  constructor(readonly response: Response) { super('Mutation declined') }
}

/** Domain writes and durable inbox entries share one commit. A caught error that
 * becomes a 4xx/5xx response must still roll back earlier writes in the handler.
 * No email/storage operations belong inside this boundary.
 */
export async function atomicMutation(operation: (db: MutationDatabase) => Promise<Response>): Promise<Response> {
  try {
    return await prisma.$transaction(async db => {
      const response = await operation(db)
      if (!response.ok) throw new RollbackResponse(response)
      return response
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 30000 })
  } catch (error) {
    if (error instanceof RollbackResponse) return error.response
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') {
      return Response.json({ code: 'CONFLICT', error: 'The record changed. Refresh and try again.' }, { status: 409 })
    }
    console.error('Atomic mutation failed:', error)
    return Response.json({ code: 'SAVE_FAILED', error: 'The change could not be saved.' }, { status: 500 })
  }
}

/** Existing inner transactions join an already-open domain transaction. */
export function joinTransaction<T>(db: Database, operation: (tx: MutationDatabase) => Promise<T>): Promise<T> {
  return '$transaction' in db ? db.$transaction(operation) : operation(db)
}
