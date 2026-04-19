import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only clients can update their branch nicknames
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Only clients can set branch nicknames' },
        { status: 403 }
      )
    }

    const { branchId } = params
    const body = await request.json()
    const { nickname } = body

    // Validate nickname
    if (nickname !== null && nickname !== undefined) {
      if (typeof nickname !== 'string') {
        return NextResponse.json(
          { error: 'Nickname must be a string' },
          { status: 400 }
        )
      }

      const trimmedNickname = nickname.trim()
      
      if (trimmedNickname.length > 50) {
        return NextResponse.json(
          { error: 'Nickname must be 50 characters or less' },
          { status: 400 }
        )
      }
    }

    // Get client record
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify branch belongs to this client
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    if (branch.clientId !== client.id) {
      return NextResponse.json(
        { error: 'You can only update nicknames for your own branches' },
        { status: 403 }
      )
    }

    // Update the nickname
    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: {
        clientNickname: nickname ? nickname.trim() : null
      },
      select: {
        id: true,
        name: true,
        clientNickname: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        phone: true
      }
    })

    return NextResponse.json(updatedBranch)
  } catch (error) {
    console.error('Error updating branch nickname:', error)
    return NextResponse.json(
      { error: 'Failed to update branch nickname' },
      { status: 500 }
    )
  }
}
