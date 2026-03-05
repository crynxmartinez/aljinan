'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, FileText, Users, ClipboardList, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'work_order' | 'client' | 'request' | 'certificate'
  title: string
  subtitle?: string
  link: string
}

const typeConfig = {
  work_order: { icon: ClipboardList, label: 'Work Orders', color: 'text-blue-600' },
  client: { icon: Users, label: 'Clients', color: 'text-green-600' },
  request: { icon: FileText, label: 'Requests', color: 'text-purple-600' },
  certificate: { icon: FileText, label: 'Certificates', color: 'text-amber-600' },
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      // const data = await response.json()
      // setResults(data)

      // Mock data for now
      const allResults: SearchResult[] = [
        {
          id: '1',
          type: 'work_order' as const,
          title: 'Fire extinguisher inspection',
          subtitle: 'ABC Corp - Scheduled',
          link: '/dashboard',
        },
        {
          id: '2',
          type: 'work_order' as const,
          title: 'Fire alarm system maintenance',
          subtitle: 'XYZ Ltd - In Progress',
          link: '/dashboard',
        },
        {
          id: '3',
          type: 'client' as const,
          title: 'ABC Corporation',
          subtitle: '5 active work orders',
          link: '/dashboard/clients/1',
        },
        {
          id: '4',
          type: 'request' as const,
          title: 'Fire door not closing properly',
          subtitle: 'Warehouse - High Priority',
          link: '/dashboard/requests',
        },
      ]
      
      const mockResults = allResults.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setResults(mockResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search clients, work orders, requests..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Search className="h-12 w-12 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for clients, work orders, or requests
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              {Object.entries(groupedResults).map(([type, items]) => {
                const config = typeConfig[type as keyof typeof typeConfig]
                const Icon = config.icon

                return (
                  <div key={type} className="border-b last:border-b-0">
                    <div className="px-3 py-2 bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', config.color)} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {config.label} ({items.length})
                        </span>
                      </div>
                    </div>
                    {items.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm font-medium">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {result.subtitle}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
