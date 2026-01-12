'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapComponentProps {
  latitude: number | null
  longitude: number | null
  onMapClick: (lat: number, lng: number) => void
}

const defaultCenter: [number, number] = [25.2048, 55.2708] // Dubai as default
const defaultZoom = 12

export default function MapComponent({ latitude, longitude, onMapClick }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    const center: [number, number] = latitude && longitude 
      ? [latitude, longitude] 
      : defaultCenter

    const map = L.map(mapRef.current).setView(center, latitude && longitude ? 16 : defaultZoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map)
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude])
      } else {
        markerRef.current = L.marker([latitude, longitude]).addTo(mapInstanceRef.current)
      }
      mapInstanceRef.current.setView([latitude, longitude], 16)
    } else if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [latitude, longitude])

  return (
    <div 
      ref={mapRef} 
      className="h-[300px] w-full"
      style={{ zIndex: 0 }}
    />
  )
}
