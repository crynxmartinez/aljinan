import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slugify'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admins to run this
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      clientsUpdated: 0,
      branchesUpdated: 0,
      clients: [] as any[],
      branches: [] as any[]
    }

    // Generate slugs for clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        companyName: true,
        slug: true,
      }
    })

    const clientSlugs: string[] = []

    for (const client of clients) {
      if (client.slug) {
        clientSlugs.push(client.slug)
        continue
      }

      const baseSlug = generateSlug(client.companyName)
      const uniqueSlug = generateUniqueSlug(baseSlug, clientSlugs)
      clientSlugs.push(uniqueSlug)

      await prisma.client.update({
        where: { id: client.id },
        data: { slug: uniqueSlug }
      })

      results.clientsUpdated++
      results.clients.push({ name: client.companyName, slug: uniqueSlug })
    }

    // Generate slugs for branches
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        clientId: true,
        name: true,
        slug: true,
      },
      orderBy: {
        clientId: 'asc'
      }
    })

    const branchSlugsByClient: Record<string, string[]> = {}

    for (const branch of branches) {
      if (branch.slug) {
        if (!branchSlugsByClient[branch.clientId]) {
          branchSlugsByClient[branch.clientId] = []
        }
        branchSlugsByClient[branch.clientId].push(branch.slug)
        continue
      }

      if (!branchSlugsByClient[branch.clientId]) {
        branchSlugsByClient[branch.clientId] = []
      }

      const baseSlug = generateSlug(branch.name)
      const uniqueSlug = generateUniqueSlug(baseSlug, branchSlugsByClient[branch.clientId])
      branchSlugsByClient[branch.clientId].push(uniqueSlug)

      await prisma.branch.update({
        where: { id: branch.id },
        data: { slug: uniqueSlug }
      })

      results.branchesUpdated++
      results.branches.push({ name: branch.name, slug: uniqueSlug })
    }

    return NextResponse.json({
      success: true,
      message: 'Slugs generated successfully',
      ...results
    })
  } catch (error) {
    console.error('Error generating slugs:', error)
    return NextResponse.json(
      { error: 'Failed to generate slugs' },
      { status: 500 }
    )
  }
}
