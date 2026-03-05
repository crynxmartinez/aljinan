'use client'

import { useEffect, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

interface GoogleMapComponentProps {
  latitude: number | null
  longitude: number | null
  onMapClick: (lat: number, lng: number) => void
}

const defaultCenter = { lat: 24.7136, lng: 46.6753 } // Riyadh, Saudi Arabia
const defaultZoom = 11

export default function GoogleMapComponent({ 
  latitude, 
  longitude, 
  onMapClick 
}: GoogleMapComponentProps) {
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">
          Google Maps API key not configured
        </p>
      </div>
    )
  }

  const center = markerPosition || defaultCenter
  const zoom = markerPosition ? 16 : defaultZoom

  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition({ lat: latitude, lng: longitude })
    }
  }, [latitude, longitude])

  const handleMapClick = (event: any) => {
    if (event.detail?.latLng) {
      const lat = event.detail.latLng.lat
      const lng = event.detail.latLng.lng
      setMarkerPosition({ lat, lng })
      onMapClick(lat, lng)
    }
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[300px] w-full rounded-lg overflow-hidden border">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="aljinan-map"
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
        >
          {markerPosition && (
            <AdvancedMarker position={markerPosition}>
              <Pin
                background="#ef4444"
                borderColor="#991b1b"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          )}
        </Map>
      </div>
    </APIProvider>
  )
}
