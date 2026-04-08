/**
 * Migration script to generate slugs for existing clients and branches
 * Run this once after adding slug fields to the database
 */

import { prisma } from '../src/lib/prisma.js'
import { generateSlug, generateUniqueSlug } from '../src/lib/utils/slugify.js'

async function main() {
  console.log('🚀 Starting slug generation...\n')

  // Generate slugs for clients
  console.log('📋 Generating slugs for clients...')
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      companyName: true,
      slug: true,
    }
  })

  const clientSlugs: string[] = []
  let clientsUpdated = 0

  for (const client of clients) {
    // Skip if slug already exists
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

    console.log(`  ✅ ${client.companyName} → ${uniqueSlug}`)
    clientsUpdated++
  }

  console.log(`\n✨ Updated ${clientsUpdated} clients\n`)

  // Generate slugs for branches
  console.log('🏢 Generating slugs for branches...')
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

  // Group branches by client to ensure unique slugs per client
  const branchSlugsByClient: Record<string, string[]> = {}
  let branchesUpdated = 0

  for (const branch of branches) {
    // Skip if slug already exists
    if (branch.slug) {
      if (!branchSlugsByClient[branch.clientId]) {
        branchSlugsByClient[branch.clientId] = []
      }
      branchSlugsByClient[branch.clientId].push(branch.slug)
      continue
    }

    // Initialize array for this client if needed
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

    console.log(`  ✅ ${branch.name} → ${uniqueSlug}`)
    branchesUpdated++
  }

  console.log(`\n✨ Updated ${branchesUpdated} branches\n`)
  console.log('🎉 Slug generation complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
