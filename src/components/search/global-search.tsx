'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Loader2, X,
  Users, MapPin, ClipboardList, FileText,
  ScrollText, Banknote, Wrench, Award,
  UserCog, Building, CalendarDays, Building2, MessageSquare,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/use-translation'

type ResultType =
  | 'client' | 'branch' | 'work_order' | 'request' | 'contract' | 'invoice' | 'equipment' | 'certificate'
  | 'team_member' | 'branch_request' | 'appointment' | 'contractor' | 'inquiry' | 'quotation'

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle?: string
  link: string
}

export function GlobalSearch() {
  const { t, locale } = useTranslation()
  const ts = t.dashboard.globalSearch

  const TYPE_CONFIG: Record<ResultType, { icon: React.ElementType; label: string; color: string }> = {
    client: { icon: Users, label: ts.categoryClients, color: 'text-green-600' },
    branch: { icon: MapPin, label: ts.categoryBranches, color: 'text-blue-600' },
    work_order: { icon: ClipboardList, label: ts.categoryWorkOrders, color: 'text-indigo-600' },
    request: { icon: FileText, label: ts.categoryRequests, color: 'text-purple-600' },
    contract: { icon: ScrollText, label: ts.categoryContracts, color: 'text-orange-600' },
    quotation: { icon: FileText, label: ts.categoryQuotations, color: 'text-orange-600' },
    invoice: { icon: Banknote, label: ts.categoryInvoices, color: 'text-emerald-600' },
    equipment: { icon: Wrench, label: ts.categoryEquipment, color: 'text-cyan-600' },
    certificate: { icon: Award, label: ts.categoryCertificates, color: 'text-amber-600' },
    team_member: { icon: UserCog, label: ts.categoryTeamMembers, color: 'text-slate-600' },
    branch_request: { icon: Building, label: ts.categoryBranchRequests, color: 'text-rose-600' },
    appointment: { icon: CalendarDays, label: ts.categoryAppointments, color: 'text-sky-600' },
    contractor: { icon: Building2, label: ts.categoryContractors, color: 'text-blue-700' },
    inquiry: { icon: MessageSquare, label: ts.categoryMessages, color: 'text-fuchsia-600' },
  }

  const TYPE_ORDER: ResultType[] = [
    'client', 'branch', 'work_order', 'request', 'contract', 'quotation', 'invoice', 'equipment', 'certificate',
    'team_member', 'branch_request', 'appointment', 'contractor', 'inquiry',
  ]

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
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

  const performSearch = useCallback(async (searchQuery: string) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
        { signal: abortRef.current.signal }
      )
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setResults(data.results ?? [])
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Search failed:', error)
        setResults([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query)
      } else {
        setResults([])
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, performSearch, locale])

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    if (abortRef.current) abortRef.current.abort()
  }

  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const items = results.filter(r => r.type === type)
    if (items.length > 0) acc[type] = items
    return acc
  }, {} as Partial<Record<ResultType, SearchResult[]>>)

  const hasResults = results.length > 0

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={ts.placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          className="ps-9 pe-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-xl z-50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium">{ts.noResultsTitle.replace('{query}', query)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ts.noResultsHint}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[480px]">
              {(Object.entries(grouped) as [ResultType, SearchResult[]][]).map(([type, items]) => {
                const { icon: Icon, label, color } = TYPE_CONFIG[type]
                return (
                  <div key={type} className="border-b last:border-b-0">
                    <div className="px-3 py-1.5 bg-muted/40 flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5', color)} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground ms-auto">{items.length}</span>
                    </div>
                    {items.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-start px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-3"
                      >
                        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', color)} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
              <div className="px-4 py-2 bg-muted/20 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  {ts.resultsFooter.replace('{count}', String(results.length))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
