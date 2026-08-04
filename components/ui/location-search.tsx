'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  address?: {
    city?: string
    town?: string
    county?: string
    state?: string
    country?: string
  }
}

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  placeholder?: string
}

function formatDisplayName(result: NominatimResult): string {
  const a = result.address
  if (!a) return result.display_name
  const parts = [
    a.city ?? a.town ?? a.county,
    a.state,
    a.country,
  ].filter(Boolean)
  return parts.length >= 2 ? parts.join(', ') : result.display_name
}

export function LocationSearch({
  value,
  onChange,
  id,
  className,
  placeholder = 'Search for a city or area…',
}: LocationSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '6',
        featuretype: 'city',
      })
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
      setIsOpen(data.length > 0)
      setActiveIndex(-1)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    onChange(q) // keep parent in sync with raw typing too
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 400)
  }

  const selectResult = (result: NominatimResult) => {
    const label = formatDisplayName(result)
    setQuery(label)
    onChange(label)
    setIsOpen(false)
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectResult(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const clearValue = () => {
    setQuery('')
    onChange('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Icon */}
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />

      {/* Input */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-activedescendant={activeIndex >= 0 ? `loc-option-${activeIndex}` : undefined}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-8 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal transition-[color,box-shadow,background-color] focus-visible:border-[#3B82F6] focus-visible:ring-3 focus-visible:ring-[#3B82F6]/20 focus-visible:bg-white"
      />

      {/* Spinner / Clear */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={clearValue}
            aria-label="Clear location"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-sm"
        >
          {results.map((result, i) => (
            <li
              key={result.place_id}
              id={`loc-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => selectResult(result)}
              className={cn(
                'flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors',
                i === activeIndex ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
              <span className="leading-snug">{formatDisplayName(result)}</span>
            </li>
          ))}
          <li className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
            Powered by OpenStreetMap / Nominatim
          </li>
        </ul>
      )}
    </div>
  )
}
