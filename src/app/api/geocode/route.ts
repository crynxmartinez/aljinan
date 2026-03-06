import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
      url += `latlng=${latlng}`
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
