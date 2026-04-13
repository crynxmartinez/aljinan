import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCached, CACHE_TAGS } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase()
    const cacheKey = CACHE_TAGS.SEARCH(session.user.id, searchTerm)

    const results = await getCached(cacheKey, async () => {
      // Run all queries in parallel for better performance
      const [workOrders, clients, requests, certificates] = await Promise.all([
        // Search work orders - simplified query
        prisma.checklistItem.findMany({
          where: {
            OR: [
              { description: { contains: searchTerm, mode: 'insensitive' } },
              { notes: { contains: searchTerm, mode: 'insensitive' } },
            ]
          },
          select: {
            id: true,
            description: true,
            stage: true,
            checklist: {
              select: {
                project: {
                  select: {
                    branchId: true,
                    branch: {
                      select: {
                        clientId: true,
                        client: {
                          select: { companyName: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          take: 5
        }),

        // Search clients (contractors only)
        session.user.role === 'CONTRACTOR'
          ? prisma.client.findMany({
              where: {
                OR: [
                  { companyName: { contains: searchTerm, mode: 'insensitive' } },
                  { companyEmail: { contains: searchTerm, mode: 'insensitive' } },
                ]
              },
              select: {
                id: true,
                companyName: true,
                companyEmail: true
              },
              take: 5
            })
          : [],

        // Search requests - simplified
        prisma.request.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ]
          },
          select: {
            id: true,
            title: true,
            status: true,
            branchId: true,
            branch: {
              select: {
                clientId: true,
                client: {
                  select: { companyName: true }
                }
              }
            }
          },
          take: 5
        }),

        // Search certificates - simplified
        prisma.certificate.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ]
          },
          select: {
            id: true,
            title: true,
            type: true,
            branchId: true,
            branch: {
              select: {
                clientId: true,
                client: {
                  select: { companyName: true }
                }
              }
            }
          },
          take: 5
        })
      ])

      // Format results
      return [
        ...workOrders.map(wo => ({
          id: wo.id,
          type: 'work_order' as const,
          title: wo.description,
          subtitle: `${wo.checklist?.project?.branch?.client?.companyName} - ${wo.stage}`,
          link: `/dashboard/clients/${wo.checklist?.project?.branch?.clientId}/branches/${wo.checklist?.project?.branchId}`
        })),
        ...clients.map(client => ({
          id: client.id,
          type: 'client' as const,
          title: client.companyName,
          subtitle: client.companyEmail || '',
          link: `/dashboard/clients/${client.id}`
        })),
        ...requests.map(req => ({
          id: req.id,
          type: 'request' as const,
          title: req.title,
          subtitle: `${req.branch?.client?.companyName} - ${req.status}`,
          link: `/dashboard/clients/${req.branch?.clientId}/branches/${req.branchId}`
        })),
        ...certificates.map(cert => ({
          id: cert.id,
          type: 'certificate' as const,
          title: cert.title,
          subtitle: `${cert.branch?.client?.companyName} - ${cert.type}`,
          link: `/dashboard/clients/${cert.branch?.clientId}/branches/${cert.branchId}`
        }))
      ]
    }, 30) // Cache for 30 seconds

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
