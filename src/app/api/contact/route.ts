import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint - no auth required
export async function POST(request: Request) {
  try {
    const { name, email, phone, companyName, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        companyName: companyName || null,
        message,
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
