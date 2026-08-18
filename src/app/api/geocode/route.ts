import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/rate-limit'

// Proxies the Google Geocoding API using our billed key. Unauthenticated, this is a free
// geocoding service for the internet charged to us, so it needs a session and a ceiling.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await enforceRateLimit(request, {
    name: 'geocode', limit: 60, window: 60, identifier: session.user.id,
  })
  if (limited) return limited

  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  const latlng = searchParams.get('latlng')

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    )
  }

  try {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?'
    
    if (address) {
      url += `address=${encodeURIComponent(address)}&region=sa`
    } else if (latlng) {
      // Only ever a coordinate pair; refuse anything else rather than forwarding it.
      if (!/^-?\d{1,3}(\.\d+)?,\s?-?\d{1,3}(\.\d+)?$/.test(latlng)) {
        return NextResponse.json({ error: 'Invalid latlng parameter' }, { status: 400 })
      }
      url += `latlng=${encodeURIComponent(latlng)}`
    } else {
      return NextResponse.json(
        { error: 'Either address or latlng parameter is required' },
        { status: 400 }
      )
    }

    url += `&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    )
  }
}
