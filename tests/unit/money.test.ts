import { describe, it, expect } from 'vitest'
import { roundMoney, sumMoney, lineTotal, computeTotals, isFullySettled } from '@/lib/money'

/**
 * Money is stored as a float, so correctness depends on rounding once at every write rather
 * than letting representation error accumulate across edits. These cases are the ones that
 * actually bite: the classic 0.1 + 0.2, a value that sits exactly on a rounding boundary,
 * and a long sum of small amounts.
 */
describe('roundMoney', () => {
  it('resolves the classic float artefact', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
  })

  it('rounds a boundary value up rather than down', () => {
    // Without the epsilon nudge this lands on 1.00, because 1.005 is stored slightly below.
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(2.675)).toBe(2.68)
  })

  it('leaves an already-exact amount alone', () => {
    expect(roundMoney(114.99)).toBe(114.99)
    expect(roundMoney(0)).toBe(0)
  })

  it('treats a non-finite input as zero rather than propagating NaN into a total', () => {
    expect(roundMoney(NaN)).toBe(0)
    expect(roundMoney(Infinity)).toBe(0)
  })

  it('handles negatives, which appear as credits', () => {
    expect(roundMoney(-1.005)).toBe(-1)
    expect(roundMoney(-0.1 - 0.2)).toBe(-0.3)
  })
})

describe('sumMoney', () => {
  it('sums a hundred small amounts exactly', () => {
    // Adding 0.01 a hundred times in plain JS gives 1.0000000000000007.
    expect(sumMoney(Array(100).fill(0.01))).toBe(1)
  })

  it('ignores null and undefined entries', () => {
    expect(sumMoney([null, undefined, 5.5])).toBe(5.5)
  })

  it('is zero for an empty list', () => {
    expect(sumMoney([])).toBe(0)
  })
})

describe('lineTotal', () => {
  it('rounds quantity times price once', () => {
    expect(lineTotal(3, 33.33)).toBe(99.99)
    expect(lineTotal(7, 1.15)).toBe(8.05)
  })

  it('supports fractional quantities, which are legitimate for hours', () => {
    expect(lineTotal(1.5, 100)).toBe(150)
    expect(lineTotal(0.5, 33.33)).toBe(16.67)
  })
})

describe('computeTotals', () => {
  it('derives subtotal, VAT and total consistently', () => {
    const totals = computeTotals([{ quantity: 3, unitPrice: 33.33 }], 15)
    expect(totals.subtotal).toBe(99.99)
    expect(totals.taxAmount).toBe(15)
    expect(totals.total).toBe(114.99)
  })

  it('keeps the total equal to subtotal plus tax across many lines', () => {
    const items = Array.from({ length
: 37 }, () => ({ quantity: 1, unitPrice: 0.07 }))
    const totals = computeTotals(items, 15)
    expect(totals.total).toBe(roundMoney(totals.subtotal + totals.taxAmount))
  })

  it('defaults a missing quantity to one', () => {
    expect(computeTotals([{ unitPrice: 50 }], 0).subtotal).toBe(50)
  })

  it('handles a zero rate', () => {
    const totals = computeTotals([{ quantity: 2, unitPrice: 10 }], 0)
    expect(totals.taxAmount).toBe(0)
    expect(totals.total).toBe(20)
  })
})

describe('isFullySettled', () => {
  it('settles on an exact payment', () => {
    expect(isFullySettled(114.99, 114.99)).toBe(true)
  })

  it('does not settle one halala short', () => {
    expect(isFullySettled(114.98, 114.99)).toBe(false)
  })

  it('settles an overpayment', () => {
    expect(isFullySettled(200, 114.99)).toBe(true)
  })

  it('does not settle an unpaid invoice', () => {
    expect(isFullySettled(0, 114.99)).toBe(false)
  })

  it('settles a zero-value invoice', () => {
    expect(isFullySettled(0, 0)).toBe(true)
  })
})
