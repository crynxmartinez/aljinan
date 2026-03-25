import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const impersonationCookie = cookieStore.get('admin_impersonating')

    if (!impersonationCookie) {
      return NextResponse.json({ impersonating: false })
    }

    const data = JSON.parse(impersonationCookie.value)
    return NextResponse.json({
      impersonating: true,
      adminEmail: data.adminEmail,
      targetEmail: data.targetEmail,
      targetRole: data.targetRole,
    })
  } catch {
    return NextResponse.json({ impersonating: false })
  }
}
