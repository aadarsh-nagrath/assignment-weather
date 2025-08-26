"use client"

import { useEffect, useRef, useState } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface Option {
  id: number
  name: string
  region?: string
  country: string
  lat: number
  lon: number
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  inputClassName
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (opt: Option) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Option[]>([])
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setOptions([])
      setOpen(false)
      return
    }
    controllerRef.current?.abort()
    const ctrl = new AbortController()
    controllerRef.current = ctrl
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/weather/search?q=${encodeURIComponent(value)}`, { signal: ctrl.signal })
        const data = await res.json()
        setOptions(data || [])
        setOpen(true)
      } catch {}
    }, 200)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [value])

  return (
    <div className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('pl-10', inputClassName)}
        onFocus={() => options.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && options.length > 0 && (
        <div className="absolute z-[9999] mt-2 w-full rounded-md border border-yellow-500/20 bg-black/80 backdrop-blur-md shadow-xl max-h-72 overflow-auto dark:block">
          {options.slice(0, 8).map((opt) => (
            <button
              key={`${opt.id}-${opt.lat}-${opt.lon}`}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-yellow-500/10"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(opt)
                setOpen(false)
              }}
            >
              <span className="text-yellow-300">{opt.name}</span>
              <span className="text-yellow-200/60 text-xs">{opt.region ? `${opt.region}, ` : ''}{opt.country}</span>
            </button>
          ))}
        </div>
      )}
      {open && options.length > 0 && (
        <div className="absolute z-[9998] mt-2 w-full rounded-md border bg-white shadow-xl max-h-72 overflow-auto dark:hidden">
          {options.slice(0, 8).map((opt) => (
            <button
              key={`light-${opt.id}-${opt.lat}-${opt.lon}`}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-blue-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(opt)
                setOpen(false)
              }}
            >
              <span className="text-blue-700">{opt.name}</span>
              <span className="text-blue-600/70 text-xs">{opt.region ? `${opt.region}, ` : ''}{opt.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
