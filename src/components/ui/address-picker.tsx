'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { MapPin, Search, Loader2, X } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

export interface AddressData {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: number | null
  longitude: number | null
}

interface AddressPickerProps {
  value: AddressData
  onChange: (data: AddressData) => void
  showManualFields?: boolean
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    state?: string
    province?: string
    postcode?: string
    country?: string
  }
}

export function AddressPicker({ value, onChange, showManualFields = true }: AddressPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      )
      const data: NominatimResult[] = await response.json()
      setSuggestions(data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error searching address:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (searchQuery.length >= 3) {
      searchTimeout.current = setTimeout(() => {
        searchAddress(searchQuery)
      }, 500)
    } else {
      setSuggestions([])
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchQuery, searchAddress])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectAddress = (result: NominatimResult) => {
    const addr = result.address
    const streetParts = [addr.house_number, addr.road].filter(Boolean)
    const street = streetParts.join(' ') || result.display_name.split(',')[0]

    onChange({
      address: street,
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || addr.province || '',
      zipCode: addr.postcode || '',
      country: addr.country || '',
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    })

    setSearchQuery(result.display_name)
    setShowSuggestions(false)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      )
      const data: NominatimResult = await response.json()
      
      if (data) {
        const addr = data.address
        const streetParts = [addr.house_number, addr.road].filter(Boolean)
        const street = streetParts.join(' ') || data.display_name.split(',')[0]

        onChange({
          address: street,
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || addr.province || '',
          zipCode: addr.postcode || '',
          country: addr.country || '',
          latitude: lat,
          longitude: lng,
        })

        setSearchQuery(data.display_name)
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      onChange({
        ...value,
        latitude: lat,
        longitude: lng,
      })
    }
  }

  const handleManualChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSuggestions([])
    onChange({
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      latitude: null,
      longitude: null,
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div ref={containerRef} className="relative">
        <Label>Search Address</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search for an address..."
            className="pl-9 pr-16"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
            {suggestions.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-start gap-2 border-b last:border-0"
                onClick={() => selectAddress(result)}
              >
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </Card>
        )}

        {showSuggestions && searchQuery.length >= 3 && suggestions.length === 0 && !isSearching && (
          <Card className="absolute z-50 w-full mt-1 p-3">
            <p className="text-sm text-muted-foreground text-center">
              No results found. Try a different search or enter manually.
            </p>
          </Card>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border">
        <MapComponent
          latitude={value.latitude}
          longitude={value.longitude}
          onMapClick={handleMapClick}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Click on the map to select a location, or search for an address above.
      </p>

      {/* Manual Entry Toggle */}
      {showManualFields && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setManualMode(!manualMode)}
          >
            {manualMode ? 'Hide' : 'Show'} Manual Entry
          </Button>

          {manualMode && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="manual-address">Street Address</Label>
                <Input
                  id="manual-address"
                  value={value.address}
                  onChange={(e) => handleManualChange('address', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-city">City</Label>
                  <Input
                    id="manual-city"
                    value={value.city}
                    onChange={(e) => handleManualChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-state">State/Province</Label>
                  <Input
                    id="manual-state"
                    value={value.state}
                    onChange={(e) => handleManualChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-zip">ZIP/Postal Code</Label>
                  <Input
                    id="manual-zip"
                    value={value.zipCode}
                    onChange={(e) => handleManualChange('zipCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-country">Country</Label>
                  <Input
                    id="manual-country"
                    value={value.country}
                    onChange={(e) => handleManualChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Address Display */}
      {value.address && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Selected Address
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {[value.address, value.city, value.state, value.zipCode, value.country]
              .filter(Boolean)
              .join(', ')}
          </p>
          {value.latitude && value.longitude && (
            <p className="text-xs text-muted-foreground mt-1">
              Coordinates: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
