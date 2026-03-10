import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@tasheel.sa' }
    })

    if (existing) {
      console.log('✅ Test account already exists!')
      console.log('Email: test@tasheel.sa')
      console.log('Password: Test123!')
      return
    }

    // Create new test user
    const hashedPassword = await bcrypt.hash('Test123!', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@tasheel.sa',
        password: hashedPassword,
        role: 'CONTRACTOR',
        contractor: {
          create: {
            companyName: 'Test Safety Company',
            phone: '0501234567',
            businessRegistration: '1234567890'
          }
        }
      },
      include: {
        contractor: true
      }
    })

    console.log('✅ Test account created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Email: test@tasheel.sa')
    console.log('Password: Test123!')
    console.log('Role: CONTRACTOR')
    console.log('Company:', user.contractor?.companyName)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
