/**
 * Money helpers.
 *
 * Amounts are stored as numeric(12,2) so what is persisted is always an exact two-decimal
 * value. The pg driver parses numeric back to a JS number (see lib/prisma.ts), which keeps
 * the ~25 files that sum and multiply these values working unchanged.
 *
 * The rule that keeps totals honest: compute in JS if you like, but round ONCE with
 * roundMoney() before persisting, and recompute derived totals from their line items
 * rather than accumulating them across updates.
 */

/** Round to two decimal places, correcting the float representation error first. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  // Number.EPSILON nudge avoids 1.005 -> 1.00 from binary representation.
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Sum a list of amounts and round once at the end. */
export function sumMoney(values: Array<number | null | undefined>): number {
  return roundMoney(
    values.reduce<number>((total, v) => total + Number(v ?? 0), 0)
  )
}

/** quantity x unitPrice, rounded once. */
export function lineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(Number(quantity) * Number(unitPrice))
}

/**
 * Derive subtotal, tax and total from line items.
 *
 * taxRate is a percentage (15 means 15%), and stays a float — it is a rate, not currency.
 */
export function computeTotals(
  items: Array<{ quantity?: number | null; unitPrice: number }>,
  taxRate: number
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = sumMoney(items.map(i => lineTotal(Number(i.quantity ?? 1), Number(i.unitPrice))))
  const taxAmount = roundMoney(subtotal * (Number(taxRate) / 100))
  const total = roundMoney(subtotal + taxAmount)
  return { subtotal, taxAmount, total }
}

/**
 * Whether an invoice is fully settled.
 *
 * Comparing floats for equality is what made "amountPaid === total" unreliable; both sides
 * are exact to two places now, and the half-halala tolerance covers any residual.
 */
export function isFullySettled(amountPaid: number, total: number): boolean {
  return roundMoney(Number(amountPaid)) >= roundMoney(Number(total)) - 0.005
}
