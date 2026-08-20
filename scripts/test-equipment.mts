import 'dotenv/config'

const BASE = 'http://localhost:3000'
const CONTRACTOR_EMAIL = 'contractor@tasheel.local'
const CONTRACTOR_PASSWORD = 'DevContractor123!'
let sessionCookie = ''

async function login(email: string, password: string) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const csrf = (await csrfRes.json()).csrfToken
  const setCookie = csrfRes.headers.get('set-cookie') || ''
  const csrfCookie = setCookie.split(';')[0]
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': csrfCookie },
    body: new URLSearchParams({ email, password, csrfToken: csrf, callbackUrl: `${BASE}/dashboard`, json: 'true' }),
    redirect: 'manual',
  })
  const loginSetCookie = loginRes.headers.get('set-cookie') || ''
  const match = loginSetCookie.match(/next-auth\.session-token=([^;]+)/)
  if (!match) throw new Error('Login failed')
  sessionCookie = `next-auth.session-token=${match[1]}`
}

async function api(method: string, path: string, body?: unknown) {
  const opts: RequestInit = { method, headers: { 'Cookie': sessionCookie, 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const text = await res.text()
  let data; try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

await login(CONTRACTOR_EMAIL, CONTRACTOR_PASSWORD)

// Get clients
const clientsRes = await api('GET', '/api/clients')
const clients = clientsRes.data as any[]
console.log('Clients:', clients.map(c => ({ id: c.id, name: c.companyName, branches: c.branches?.map((b: any) => b.id) })))

const clientWithBranch = clients.find(c => c.branches?.length > 0)
if (!clientWithBranch) { console.log('No client with branches'); process.exit(1) }

const branchId = clientWithBranch.branches[0].id
console.log('Using branchId:', branchId)

// Create equipment
console.log('\n--- Creating equipment ---')
const createRes = await api('POST', `/api/branches/${branchId}/equipment`, {
  equipmentNumber: 'FE-TEST-001',
  equipmentType: 'FIRE_EXTINGUISHER',
  brand: 'SFF',
  model: 'CO2-5',
  serialNumber: 'SFF-001',
  location: 'Floor 1',
  dateAdded: new Date().toISOString(),
  expectedExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
})
console.log('Create response:', createRes.status, JSON.stringify(createRes.data))

// Fetch equipment
console.log('\n--- Fetching equipment ---')
const getRes = await api('GET', `/api/branches/${branchId}/equipment`)
console.log('Get response:', getRes.status, JSON.stringify(getRes.data))

process.exit(0)
