import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

// POST: Sign in as impersonated user (called from client after impersonate API)
export async function POST(request: Request) {
  try {
    // Verify impersonation cookie exists
    const cookieStore = await cookies()
    const impersonationCookie = cookieStore.get('admin_impersonating')
    
    if (!impersonationCookie) {
      return NextResponse.json({ error: 'No impersonation session found' }, { status: 400 })
    }

    const impData = JSON.parse(impersonationCookie.value)
    const { impersonationData } = await request.json()

    // Verify the impersonation data matches the cookie
    if (impData.targetUserId !== impersonationData.id) {
      return NextResponse.json({ error: 'Impersonation data mismatch' }, { status: 400 })
    }

    // Create a special session token for the impersonated user
    // This will be picked up by NextAuth callbacks
    return NextResponse.json({
      success: true,
      user: impersonationData,
    })
  } catch (error) {
    console.error('Error in impersonation signin:', error)
    return NextResponse.json(
      { error: 'Failed to sign in as impersonated user' },
      { status: 500 }
    )
  }
}
