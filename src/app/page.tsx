'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, MapPin, Thermometer, Droplets, Wind, Sun, Cloud, CloudRain, CloudSnow, Zap, Eye, Gauge, Moon, SunMedium, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Autocomplete } from '@/components/ui/autocomplete'

interface City { id: string; name: string; country: string; lat: number; lon: number; order?: number }
interface WeatherData { current: any; forecast: any[]; city: { name: string; country: string; lat: number; lon: number } }

function usePersistentState<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    const s = window.localStorage.getItem(key)
    if (s == null) return initial
    try { return JSON.parse(s) as T } catch { return s as unknown as T }
  })
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(v)) }, [key, v])
  return [v, setV] as const
}

function getWeatherIcon(condition: string): { icon: React.ReactNode; color: string } {
  const iconMap: { [key: string]: { icon: React.ReactNode; color: string } } = {
    '1000': { icon: <Sun className="w-8 h-8" />, color: 'text-yellow-400' },
    '1003': { icon: <Cloud className="w-8 h-8" />, color: 'text-yellow-300' },
    '1006': { icon: <Cloud className="w-8 h-8" />, color: 'text-yellow-200/80' },
    '1009': { icon: <Cloud className="w-8 h-8" />, color: 'text-yellow-200/60' },
    '1030': { icon: <Eye className="w-8 h-8" />, color: 'text-yellow-200/70' },
    '1063': { icon: <CloudRain className="w-8 h-8" />, color: 'text-yellow-300' },
    '1066': { icon: <CloudSnow className="w-8 h-8" />, color: 'text-yellow-200' },
    '1069': { icon: <CloudSnow className="w-8 h-8" />, color: 'text-yellow-200' },
    '1087': { icon: <Zap className="w-8 h-8" />, color: 'text-yellow-400' },
  }
  return iconMap[condition] || { icon: <Sun className="w-8 h-8" />, color: 'text-yellow-400' }
}

export default function WeatherDashboard() {
  const [cities, setCities] = usePersistentState<City[]>('cities-order', [])
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData | null }>({})
  const [query, setQuery] = useState('')
  const [units, setUnits] = usePersistentState<'metric' | 'imperial'>('units', 'metric')
  const [theme, setTheme] = usePersistentState<'stealth' | 'neon'>('theme', 'neon')
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const m = (localStorage.getItem('themeMode') as 'dark' | 'light' | null)
    return m ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  useEffect(() => { setMounted(true); fetchCities() }, [])
  useEffect(() => { document.documentElement.classList.toggle('dark', mode === 'dark'); localStorage.setItem('themeMode', mode) }, [mode])
  useEffect(() => {
    const id = setInterval(() => { cities.forEach((c) => fetchWeatherData(c)) }, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [cities])

  const fetchCities = async () => {
    try { const r = await fetch('/api/cities'); const d = await r.json(); const ordered = d.map((c: City, i: number) => ({ ...c, order: i })); setCities(ordered); ordered.forEach(fetchWeatherData) } catch {}
  }

  const fetchWeatherData = async (city: City) => {
    try { const r = await fetch(`/api/weather?city=${city.name}&country=${city.country}`); if (!r.ok) return; const d = await r.json(); setWeatherData((p) => ({ ...p, [city.id]: d })) } catch {}
  }

  const addCityFromText = async () => { if (!query.trim()) return; const [name, country] = query.split(',').map(s => s.trim()); if (!name || !country) return; await addCity({ name, country }) }
  const addCity = async ({ name, country, lat, lon }: { name: string, country: string, lat?: number, lon?: number }) => {
    const res = await fetch('/api/cities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, country, lat, lon }) })
    if (res.ok) { const nc: City = await res.json(); const withOrder = { ...nc, order: cities.length }; setCities((p) => [withOrder, ...p]); fetchWeatherData(withOrder); setQuery('') }
  }
  const removeCity = async (id: string) => { await fetch(`/api/cities?id=${id}`, { method: 'DELETE' }); setCities((p) => p.filter(c => c.id !== id)); setWeatherData((p) => { const n = { ...p }; delete (n as any)[id]; return n }) }
  const moveCity = (id: string, dir: 'up' | 'down') => { setCities((p) => { const a=[...p]; const i=a.findIndex(c=>c.id===id); const s=dir==='up'?i-1:i+1; if(i<0||s<0||s>=a.length)return p; const t=a[i]; a[i]=a[s]; a[s]=t; return a.map((c,idx)=>({ ...c, order: idx })) }) }

  const toTemp = (c: number) => units === 'metric' ? `${Math.round(c)}°C` : `${Math.round(c * 9/5 + 32)}°F`
  const toSpeed = (kph: number) => units === 'metric' ? `${Math.round(kph)} km/h` : `${Math.round(kph / 1.609)} mph`
  const formatDate = (s: string) => { try { const d=new Date(s); if(isNaN(d.getTime())) return 'Invalid Date'; return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) } catch { return 'Invalid Date' } }

  const renderHourly = (f: any[]) => { const hours = f?.[0]?.hour || []; return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max">
        {hours.slice(0, 24).map((h: any) => (
          <div key={h.time_epoch} className={`${mode==='dark'?'bg-black/40 border-yellow-500/10':'bg-blue-50 border-blue-200'} px-3 py-2 rounded-lg border text-center`}>
            <div className={`${mode==='dark'?'text-yellow-200/70':'text-blue-700/70'} text-xs`}>{new Date(h.time).toLocaleTimeString([], { hour: '2-digit' })}</div>
            <div className={`${mode==='dark'?'text-foreground':'text-blue-700'} text-sm font-semibold`}>{toTemp(h.temp_c)}</div>
          </div>
        ))}
      </div>
    </div>
  )}

  const renderWeatherCard = (city: City) => {
    const w = weatherData[city.id]
    if (w === undefined) return (<div className="space-y-4"><Skeleton className="h-32 w-full bg-black/50"/><Skeleton className="h-24 w-full bg-black/50"/><Skeleton className="h-20 w-full bg-black/50"/></div>)
    if (w === null || !w.current || !w.current.condition) return (<div className="text-center py-8"><div className="text-4xl mb-2">⚠️</div><p className="text-muted-foreground">Weather data unavailable</p></div>)
    const cw = w.current.condition; const main = w.current; const ic = getWeatherIcon(cw.code?.toString() || '1000')
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`mx-auto mb-4 ${ic.color}`}>{ic.icon}</div>
          <div className={`${mode==='dark'?'gradient-text':'text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600'} text-5xl font-extrabold mb-1`}>{toTemp(main.temp_c || 0)}</div>
          <p className={`${mode==='dark'?'text-yellow-200/80':'text-blue-700/80'} capitalize text-sm tracking-wide`}>{cw.text || 'Unknown'}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className={`${mode==='dark'?'bg-black/50 border-yellow-500/10':'bg-blue-50 border-blue-200'} text-center p-3 rounded-lg border`}><Thermometer className={`${mode==='dark'?'text-yellow-400':'text-blue-600'} w-5 h-5 mx-auto mb-2`}/><span className={`${mode==='dark'?'text-foreground':'text-blue-700'} font-semibold text-sm`}>{toTemp(main.feelslike_c || 0)}</span><p className={`${mode==='dark'?'text-yellow-200/70':'text-blue-700/70'} text-xs`}>Feels like</p></div>
          <div className={`${mode==='dark'?'bg-black/50 border-yellow-500/10':'bg-blue-50 border-blue-200'} text-center p-3 rounded-lg border`}><Droplets className={`${mode==='dark'?'text-yellow-400':'text-blue-600'} w-5 h-5 mx-auto mb-2`}/><span className={`${mode==='dark'?'text-foreground':'text-blue-700'} font-semibold text-sm`}>{main.humidity || 0}%</span><p className={`${mode==='dark'?'text-yellow-200/70':'text-blue-700/70'} text-xs`}>Humidity</p></div>
          <div className={`${mode==='dark'?'bg-black/50 border-yellow-500/10':'bg-blue-50 border-blue-200'} text-center p-3 rounded-lg border`}><Wind className={`${mode==='dark'?'text-yellow-400':'text-blue-600'} w-5 h-5 mx-auto mb-2`}/><span className={`${mode==='dark'?'text-foreground':'text-blue-700'} font-semibold text-sm`}>{toSpeed(main.wind_kph || 0)}</span><p className={`${mode==='dark'?'text-yellow-200/70':'text-blue-700/70'} text-xs`}>Wind</p></div>
        </div>
        {w.forecast && w.forecast.length>0 && (<>
          <Separator className={`${mode==='dark'?'bg-yellow-500/20':'bg-blue-200'}`} />
          <div>
            <h4 className={`${mode==='dark'?'text-foreground':'text-blue-700'} font-semibold mb-4 text-center`}>5-Day Forecast</h4>
            <div className="grid grid-cols-5 gap-3">
              {w.forecast.map((d:any,idx:number)=>{ const di=getWeatherIcon(d.day?.condition?.code?.toString()||'1000'); return (
                <div key={idx} className={`${mode==='dark'?'bg-black/40 border-yellow-500/10':'bg-blue-50 border-blue-200'} text-center p-2 rounded-lg border`}>
                  <div className={`mx-auto mb-2 ${di.color}`}>{di.icon}</div>
                  <div className={`${mode==='dark'?'text-foreground':'text-blue-700'} text-sm font-medium`}>{toTemp(d.day?.avgtemp_c || 0)}</div>
                  <div className={`${mode==='dark'?'text-yellow-200/70':'text-blue-700/70'} text-xs`}>{formatDate(d.date || new Date().toISOString())}</div>
                </div>)})}
            </div>
          </div>
          {renderHourly(w.forecast)}
        </>)}
      </div>
    )
  }

  if (!mounted) return (
    <div className="min-h-screen p-6 bg-black">
      <div className="max-w-7xl mx-auto"><div className="text-center py-16"><Skeleton className="h-12 w-48 mx-auto mb-4 bg-black/50"/><Skeleton className="h-6 w-64 mx-auto bg-black/50"/></div></div>
    </div>
  )

  const pageBg = mode === 'dark' ? (theme==='neon'?'gradient-bg':'bg-black') : 'bg-white'
  return (
    <div className={`min-h-screen p-6 ${pageBg}`}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="text-center">
            <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className={`text-5xl font-extrabold mb-3 ${mode==='dark'?'gradient-text':'text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600'}`}>Weather Dashboard</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className={`text-lg ${mode==='dark'?'text-yellow-200/80':'text-blue-700/80'}`}>Real-time weather data for multiple cities</motion.p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className={`${mode==='dark'?'bg-black/60 border border-yellow-500/20 text-yellow-200 hover:bg-black/70':'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'}`} onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}>
              {units === 'metric' ? '°C / km/h' : '°F / mph'}
            </Button>
            <Button variant="secondary" className={`${mode==='dark'?'bg-black/60 border border-yellow-500/20 text-yellow-200 hover:bg-black/70':'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'}`} onClick={() => setTheme(theme === 'neon' ? 'stealth' : 'neon')}>
              {theme === 'neon' ? <Moon className="w-4 h-4 mr-2" /> : <SunMedium className="w-4 h-4 mr-2" />}{theme === 'neon' ? 'Stealth' : 'Neon'}
            </Button>
            <Button variant="secondary" className={`${mode==='dark'?'bg-black/60 border border-yellow-500/20 text-yellow-200 hover:bg-black/70':'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'}`} onClick={() => setMode(mode==='dark'?'light':'dark')}>
              {mode==='dark' ? <SunMedium className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}{mode==='dark'?'Light':'Dark'}
            </Button>
            <Button variant="secondary" className={`${mode==='dark'?'bg-black/60 border border-yellow-500/20 text-yellow-200 hover:bg-black/70':'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'}`} onClick={() => navigator.clipboard.writeText(window.location.href)}>
              Copy Link
            </Button>
          </div>
        </div>

        <Card className={`${mode==='dark'?'glass-card':'border border-blue-200 bg-white'} mb-8`}>
          <CardContent className="p-6">
            <div className="flex gap-4 max-w-xl mx-auto items-center">
              <div className="flex-1 relative">
                <Search className={`${mode==='dark'?'text-yellow-300/70':'text-blue-600/70'} absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5`} />
                <Autocomplete
                  value={query}
                  onChange={setQuery}
                  onSelect={(opt) => addCity({ name: opt.name, country: opt.country, lat: opt.lat, lon: opt.lon })}
                  placeholder="Search city..."
                  className="[&>input]:pl-10"
                  inputClassName={mode==='dark' ? 'bg-black/50 border-yellow-500/20 text-foreground placeholder:text-yellow-200/50' : 'bg-white border-blue-200 text-blue-800 placeholder:text-blue-400'}
                />
              </div>
              <Button onClick={addCityFromText} className={`${mode==='dark'?'bg-yellow-400 text-black hover:bg-yellow-300':'bg-blue-600 text-white hover:bg-blue-500'} px-6`}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {cities.map((city, index) => (
              <motion.div key={city.id} initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }} transition={{ delay: index * 0.06, duration: 0.25 }}>
                <Card className={`${mode==='dark'?'glass-card':'border border-blue-200 bg-white'} h-full`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`${mode==='dark'?'bg-yellow-500/15':'bg-blue-100'} p-2 rounded-full`}>
                          <MapPin className={`${mode==='dark'?'text-yellow-400':'text-blue-600'} w-5 h-5`} />
                        </div>
                        <div>
                          <CardTitle className={`${mode==='dark'?'text-foreground':'text-blue-700'} text-xl`}>{city.name}</CardTitle>
                          <CardDescription className={`${mode==='dark'?'text-yellow-200/70':'text-blue-700/70'}`}>{city.country}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className={`${mode==='dark'?'text-yellow-200/70 hover:text-yellow-400 hover:bg-yellow-500/10':'text-blue-700 hover:bg-blue-50'} `} onClick={() => moveCity(city.id, 'up')}><ArrowUp className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className={`${mode==='dark'?'text-yellow-200/70 hover:text-yellow-400 hover:bg-yellow-500/10':'text-blue-700 hover:bg-blue-50'} `} onClick={() => moveCity(city.id, 'down')}><ArrowDown className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeCity(city.id)} className={`${mode==='dark'?'text-yellow-200/70 hover:text-yellow-400 hover:bg-yellow-500/10':'text-blue-700 hover:bg-blue-50'}`}><X className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderWeatherCard(city)}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {cities.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="text-6xl mb-4">🌤️</div>
            <h3 className={`text-2xl font-semibold mb-2 ${mode==='dark'?'text-foreground':'text-blue-700'}`}>No cities added yet</h3>
            <p className={`${mode==='dark'?'text-yellow-200/80':'text-blue-700/80'}`}>Add your first city to start monitoring the weather</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
