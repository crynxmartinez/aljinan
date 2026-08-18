import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit } from '@/lib/rate-limit'
import { validateEmail, validateLength } from '@/lib/validation'
import { sanitizePlainText } from '@/lib/sanitize'

// Public endpoint - no auth required
export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit(request, { name: 'contact', limit: 5, window: 3600 })
    if (limited) return limited

    const { name, email, phone, companyName, message } = await request.json()

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Name, email, phone, and message are required' },
        { status: 400 }
      )
    }

    // Unauthenticated endpoint: validate types and cap every field, or this table is an
    // open write target for anything with an HTTP client.
    if (
      typeof name !== 'string' || typeof email !== 'string' ||
      typeof phone !== 'string' || typeof message !== 'string' ||
      (companyName != null && typeof companyName !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 })
    }

    for (const [value, min, max, field] of [
      [name, 1, 100, 'Name'],
      [phone, 1, 30, 'Phone'],
      [message, 1, 2000, 'Message'],
      [companyName || '', 0, 150, 'Company name'],
    ] as const) {
      const check = validateLength(value, min, max, field)
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 })
      }
    }

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: sanitizePlainText(name),
        email: email.toLowerCase().trim(),
        phone: sanitizePlainText(phone),
        companyName: companyName ? sanitizePlainText(companyName) : null,
        message: sanitizePlainText(message),
      },
    })

    return NextResponse.json({ success: true, id: inquiry.id })
  } catch (error) {
    console.error('Error creating contact inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}
