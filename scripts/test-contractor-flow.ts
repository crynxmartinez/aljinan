/**
 * End-to-end contractor workflow test script.
 * Tests: login → create client → create branch → add equipment → create request →
 *        create contract with systems → client signs contract → work orders generated →
 *        move work orders through lifecycle → verify completion
 */
import 'dotenv/config'

const BASE = 'http://localhost:3000'
const CONTRACTOR_EMAIL = 'contractor@tasheel.local'
const CONTRACTOR_PASSWORD = 'DevContractor123!'
const CLIENT_EMAIL = 'client@tasheel.local'
const CLIENT_PASSWORD = 'DevClient123!'

let sessionCookie = ''

async function login(email: string, password: string): Promise<void> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const csrf = (await csrfRes.json()).csrfToken
  const setCookie = csrfRes.headers.get('set-cookie') || ''
  const csrfCookie = setCookie.split(';')[0]

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie,
    },
    body: new URLSearchParams({
      email, password, csrfToken: csrf,
      callbackUrl: `${BASE}/dashboard`, json: 'true',
    }),
    redirect: 'manual',
  })

  const loginSetCookie = loginRes.headers.get('set-cookie') || ''
  const match = loginSetCookie.match(/next-auth\.session-token=([^;]+)/)
  if (!match) throw new Error(`Login failed for ${email} - no session token`)
  sessionCookie = `next-auth.session-token=${match[1]}`
  console.log(`  [LOGIN] Success as ${email}`)
}

async function api(method: string, path: string, body?: unknown) {
  const opts: RequestInit = {
    method,
    headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

function log(label: string, status: number, data: unknown, maxLen = 250) {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  console.log(`  [${label}] ${status} | ${str.substring(0, maxLen)}`)
}

async function main() {
  // === STEP 1: Login as contractor ===
  console.log('\n=== STEP 1: Login as Contractor ===')
  await login(CONTRACTOR_EMAIL, CONTRACTOR_PASSWORD)
  const session = await api('GET', '/api/auth/session')
  log('SESSION', session.status, session.data)

  // === STEP 2: Get existing clients & branches ===
  console.log('\n=== STEP 2: Get existing clients & branches ===')
  const clientsRes = await api('GET', '/api/clients')
  const clients = clientsRes.data as Array<{ id: string; companyName: string; branches?: Array<{ id: string; name: string }> }>
  if (!Array.isArray(clients) || clients.length === 0) throw new Error('No clients found')
  // Find the client that has branches (the seeded one)
  const client = clients.find(c => c.branches && c.branches.length > 0) || clients[0]
  console.log(`  Client: ${client.companyName} (${client.id})`)
  client.branches?.forEach(b => console.log(`    Branch: ${b.name} (${b.id})`))

  const branch = client.branches?.[0]
  if (!branch) throw new Error('No branches found - need to create one first')
  const branchId = branch.id
  const clientId = client.id

  // === STEP 3: Create a new client ===
  console.log('\n=== STEP 3: Create a new client ===')
  const newClientRes = await api('POST', '/api/clients', {
    companyName: 'Jeddah Mall Group',
    companyEmail: 'jeddah.mall.test@tasheel.local',
    companyPhone: '+966540000001',
  })
  log('NEW CLIENT', newClientRes.status, newClientRes.data)

  // === STEP 4: Create a new branch ===
  console.log('\n=== STEP 4: Create a new branch ===')
  const newBranchRes = await api('POST', `/api/clients/${clientId}/branches`, {
    name: 'Jeddah Branch - Main Building',
    address: 'Tahlia Street, Jeddah',
    city: 'Jeddah',
    state: 'Makkah Province',
    zipCode: '21477',
    country: 'Saudi Arabia',
    phone: '+966500000002',
    buildingType: 'COMMERCIAL',
    floorCount: 3,
    areaSize: 1200.0,
  })
  log('NEW BRANCH', newBranchRes.status, newBranchRes.data)

  // === STEP 5: Add equipment to the existing branch ===
  console.log('\n=== STEP 5: Add equipment to branch ===')
  const eq1Res = await api('POST', `/api/branches/${branchId}/equipment`, {
    equipmentNumber: 'FE-CO2-001',
    equipmentType: 'FIRE_EXTINGUISHER',
    brand: 'SFF',
    model: 'CO2-5',
    serialNumber: 'SFF-CO2-001',
    location: 'Floor 1 - Near entrance',
    dateAdded: new Date().toISOString(),
    expectedExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
  })
  log('EQUIPMENT 1', eq1Res.status, eq1Res.data)

  const eq2Res = await api('POST', `/api/branches/${branchId}/equipment`, {
    equipmentNumber: 'FA-PANEL-001',
    equipmentType: 'FIRE_ALARM_PANEL',
    brand: 'Honeywell',
    model: 'XLS100',
    serialNumber: 'HW-XLS-001',
    location: 'Main control room',
    dateAdded: new Date().toISOString(),
    expectedExpiry: new Date(Date.now() + 180 * 86400000).toISOString(),
  })
  log('EQUIPMENT 2', eq2Res.status, eq2Res.data)

  // === STEP 6: Create a service request ===
  console.log('\n=== STEP 6: Create a service request ===')
  const reqRes = await api('POST', `/api/branches/${branchId}/requests`, {
    title: 'Quarterly Fire Safety Maintenance',
    description: 'Quarterly maintenance of fire safety equipment - extinguishers and alarm panel inspection',
    priority: 'HIGH',
    workOrderType: 'MAINTENANCE',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
  })
  log('REQUEST', reqRes.status, reqRes.data)
  const requestData = reqRes.data as { id?: string; error?: string }

  // === STEP 7: Create a contract with systems (for work order generation) ===
  console.log('\n=== STEP 7: Create a contract with systems ===')
  const now = new Date()
  const visit1 = new Date(now.getTime() + 7 * 86400000).toISOString()
  const visit2 = new Date(now.getTime() + 97 * 86400000).toISOString()
  const visit3 = new Date(now.getTime() + 187 * 86400000).toISOString()
  const visit4 = new Date(now.getTime() + 277 * 86400000).toISOString()

  const contractRes = await api('POST', `/api/branches/${branchId}/contracts`, {
    title: 'Fire Safety Maintenance Contract - Annual 2026',
    description: 'Annual maintenance and inspection of all fire safety equipment',
    startDate: now.toISOString(),
    endDate: new Date(now.getTime() + 365 * 86400000).toISOString(),
    status: 'DRAFT',
    systems: [
      {
        name: 'Fire Extinguisher System',
        description: 'Quarterly inspection of all fire extinguishers',
        frequency: 'QUARTERLY',
        visitDates: [visit1, visit2, visit3, visit4],
        paymentAmounts: ['2500', '2500', '2500', '2500'],
        paymentDueDates: [visit1, visit2, visit3, visit4],
        dateMode: 'MANUAL',
        paymentDateMode: 'MANUAL',
      },
      {
        name: 'Fire Alarm System',
        description: 'Quarterly inspection of fire alarm panels',
        frequency: 'QUARTERLY',
        visitDates: [visit1, visit2, visit3, visit4],
        paymentAmounts: ['3000', '3000', '3000', '3000'],
        paymentDueDates: [visit1, visit2, visit3, visit4],
        dateMode: 'MANUAL',
        paymentDateMode: 'MANUAL',
      },
    ],
  })
  log('CONTRACT', contractRes.status, contractRes.data, 400)
  const contractData = contractRes.data as { id?: string; error?: string }
  const contractId = contractData?.id

  if (!contractId) {
    console.log('  Contract creation failed, checking existing...')
  }

  // === STEP 8: Login as client and sign the contract ===
  console.log('\n=== STEP 8: Login as client and sign contract ===')
  await login(CLIENT_EMAIL, CLIENT_PASSWORD)

  if (contractId) {
    const signRes = await api('PATCH', `/api/branches/${branchId}/contracts/${contractId}`, {
      action: 'start_sign',
      signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    })
    log('SIGN CONTRACT', signRes.status, signRes.data, 300)
  }

  // === STEP 9: Login as contractor again, check work orders ===
  console.log('\n=== STEP 9: Check generated work orders ===')
  await login(CONTRACTOR_EMAIL, CONTRACTOR_PASSWORD)

  const woRes = await api('GET', '/api/work-orders')
  log('WORK ORDERS', woRes.status, woRes.data, 500)
  const workOrders = woRes.data as Array<{ id: string; workOrderNumber: number; stage: string; description: string; branchName: string }>

  if (Array.isArray(workOrders) && workOrders.length > 0) {
    console.log(`\n  Found ${workOrders.length} work orders:`)
    workOrders.forEach(wo => {
      console.log(`    WO-${String(wo.workOrderNumber).padStart(4, '0')} | ${wo.stage} | ${wo.description} | ${wo.branchName}`)
    })

    // === STEP 10: Move work orders through lifecycle ===
    console.log('\n=== STEP 10: Move work orders through lifecycle ===')

    for (const wo of workOrders) {
      if (wo.stage === 'SCHEDULED') {
        console.log(`\n  WO-${String(wo.workOrderNumber).padStart(4, '0')}: SCHEDULED → IN_PROGRESS`)
        const startRes = await api('PATCH', `/api/branches/${branchId}/checklist-items`, {
          action: 'update_stage',
          itemId: wo.id,
          stage: 'IN_PROGRESS',
        })
        log('  START', startRes.status, startRes.data, 150)
      }
    }

    // Re-fetch to get updated stages
    const woRes2 = await api('GET', '/api/work-orders')
    const workOrders2 = woRes2.data as Array<{ id: string; workOrderNumber: number; stage: string; description: string }>

    for (const wo of workOrders2) {
      if (wo.stage === 'IN_PROGRESS') {
        console.log(`\n  WO-${String(wo.workOrderNumber).padStart(4, '0')}: IN_PROGRESS → FOR_REVIEW`)

        // Fill inspection report first
        const inspectRes = await api('PATCH', `/api/branches/${branchId}/checklist-items`, {
          action: 'update_inspection',
          workOrderId: wo.id,
          inspectionDate: new Date().toISOString(),
          problemScope: 'Routine quarterly maintenance',
          findings: 'All equipment in good condition',
          actionTaken: 'Inspected and serviced all fire safety equipment',
          systemStatus: 'WORKING',
          technicianNotes: 'No issues found. All systems operational.',
          systemsMaintained: 'Fire extinguishers, Fire alarm panel',
          maintenancePerformed: 'Visual inspection, functional test, cleaning',
          partsServiced: 'N/A',
          testResult: 'PASSED',
          inspectionResult: 'PASSED',
          systemsChecked: ['Fire Alarm', 'Extinguishers'],
          areasInspected: 'Floor 1, Floor 2, Control Room',
        })
        log('  INSPECT', inspectRes.status, inspectRes.data, 150)

        // Move to FOR_REVIEW
        const reviewRes = await api('PATCH', `/api/branches/${branchId}/checklist-items`, {
          action: 'update_stage',
          itemId: wo.id,
          stage: 'FOR_REVIEW',
        })
        log('  REVIEW', reviewRes.status, reviewRes.data, 150)
      }
    }

    // Re-fetch and move FOR_REVIEW → COMPLETED (via signatures)
    const woRes3 = await api('GET', '/api/work-orders')
    const workOrders3 = woRes3.data as Array<{ id: string; workOrderNumber: number; stage: string; description: string; price: number | null }>

    for (const wo of workOrders3) {
      if (wo.stage === 'FOR_REVIEW') {
        console.log(`\n  WO-${String(wo.workOrderNumber).padStart(4, '0')}: FOR_REVIEW → COMPLETED`)

        // Set price first (must be before signatures for auto-completion)
        const priceRes = await api('PATCH', `/api/branches/${branchId}/checklist-items`, {
          action: 'update_price',
          itemId: wo.id,
          price: 2500,
        })
        log('  SET PRICE', priceRes.status, priceRes.data, 100)

        // Technician sign
        const techSignRes = await api('PATCH', `/api/branches/${branchId}/checklist-items`, {
          action: 'technician_sign',
          workOrderId: wo.id,
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        })
        log('  TECH SIGN', techSignRes.status, techSignRes.data, 100)
      }
    }

    // Login as client to sign and trigger auto-completion
    console.log('\n  --- Switching to client for acceptance signatures ---')
    await login(CLIENT_EMAIL, CLIENT_PASSWORD)

    const woRes4 = await api('GET', '/api/work-orders')
    const workOrders4 = woRes4.data as Array<{ id: string; workOrderNumber: number; stage: string; description: string }>

    for (const wo of workOrders4) {
      if (wo.stage === 'FOR_REVIEW') {
        console.log(`\n  WO-${String(wo.workOrderNumber).padStart(4, '0')}: Client signing for completion`)
        const clientSignRes = await api('PATCH', `/api/branches/${branchId}/checklist-items`, {
          action: 'client_sign',
          workOrderId: wo.id,
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        })
        log('  CLIENT SIGN', clientSignRes.status, clientSignRes.data, 150)
      }
    }

    // Switch back to contractor for verification
    await login(CONTRACTOR_EMAIL, CONTRACTOR_PASSWORD)
  } else {
    console.log('  No work orders found. Contract signing may have failed.')
  }

  // === STEP 11: Verify final state ===
  console.log('\n=== STEP 11: Verify final state ===')

  const finalWoRes = await api('GET', '/api/work-orders')
  const finalWoData = finalWoRes.data as Array<{ id: string; workOrderNumber: number; stage: string; description: string }>
  if (Array.isArray(finalWoData)) {
    console.log(`\n  Final work orders (${finalWoData.length} total):`)
    finalWoData.forEach(wo => {
      console.log(`    WO-${String(wo.workOrderNumber).padStart(4, '0')} | ${wo.stage} | ${wo.description}`)
    })
  }

  // Check dashboard
  const dashRes = await api('GET', '/api/dashboard/action-center')
  log('\nDASHBOARD', dashRes.status, dashRes.data, 400)

  // Check equipment
  const equipRes = await api('GET', `/api/branches/${branchId}/equipment`)
  const equipData = equipRes.data as Array<{ id: string; equipmentNumber: string; equipmentType: string; status: string }>
  if (Array.isArray(equipData)) {
    console.log(`\n  Equipment (${equipData.length} total):`)
    equipData.forEach(e => console.log(`    ${e.equipmentNumber} | ${e.equipmentType} | ${e.status}`))
  }

  // Check certificates
  const certRes = await api('GET', `/api/branches/${branchId}/certificates`)
  const certData = certRes.data as Array<{ id: string; title: string; type: string; status: string }>
  if (Array.isArray(certData)) {
    console.log(`\n  Certificates (${certData.length} total):`)
    certData.forEach(c => console.log(`    ${c.title} | ${c.type} | ${c.status}`))
  }

  // Check analytics
  const analyticsRes = await api('GET', '/api/analytics/dashboard')
  log('\nANALYTICS', analyticsRes.status, analyticsRes.data, 400)

  console.log('\n=== TEST COMPLETE ===')
}

main().catch(err => {
  console.error('\n=== TEST FAILED ===')
  console.error(err.message)
  process.exit(1)
})
