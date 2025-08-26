import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'

const WEATHER_API_KEY = process.env.WEATHERAPI_KEY || ''
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'
const DEFAULT_USER_ID = 'default'

let memoryCities: any[] = []
function canUseDb() {
  if (process.env.VERCEL) return false
  if (!process.env.DATABASE_URL) return false
  return true
}

export async function GET() {
  try {
    if (!canUseDb()) return NextResponse.json(memoryCities)
    const cities = await prisma.city.findMany({ where: { userId: DEFAULT_USER_ID }, orderBy: { order: 'asc' } })
    return NextResponse.json(cities)
  } catch (error) {
    return NextResponse.json(memoryCities)
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      try {
        const txt = await request.text()
        body = JSON.parse(txt)
      } catch { body = {} }
    }

    const { name, country, lat, lon, id, direction } = body || {}

    if (!canUseDb()) {
      if (id && direction) {
        const idx = memoryCities.findIndex(c => c.id === id)
        if (idx === -1) return NextResponse.json(memoryCities)
        const s = direction === 'up' ? idx - 1 : idx + 1
        if (s < 0 || s >= memoryCities.length) return NextResponse.json(memoryCities)
        const tmp = memoryCities[idx]; memoryCities[idx] = memoryCities[s]; memoryCities[s] = tmp
        return NextResponse.json(memoryCities)
      }
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'City name is required' }, { status: 400 })
      }
      const safeCountry = (typeof country === 'string' && country.trim()) ? country : 'NA'
      const newCity = { id: `${Date.now()}`, name: name.trim(), country: safeCountry, lat: typeof lat === 'number' ? lat : 0, lon: typeof lon === 'number' ? lon : 0, order: memoryCities.length }
      memoryCities = [newCity, ...memoryCities]
      return NextResponse.json(newCity, { status: 201 })
    }

    if (id && direction) {
      const list = await prisma.city.findMany({ where: { userId: DEFAULT_USER_ID }, orderBy: { order: 'asc' } })
      const idx = list.findIndex(c => c.id === id)
      if (idx < 0) return NextResponse.json({ error: 'City not found' }, { status: 404 })
      const swapWith = direction === 'up' ? idx - 1 : idx + 1
      if (swapWith < 0 || swapWith >= list.length) return NextResponse.json(list)
      const a = list[idx], b = list[swapWith]
      await prisma.$transaction([
        prisma.city.update({ where: { id: a.id }, data: { order: b.order } }),
        prisma.city.update({ where: { id: b.id }, data: { order: a.order } })
      ])
      const updated = await prisma.city.findMany({ where: { userId: DEFAULT_USER_ID }, orderBy: { order: 'asc' } })
      return NextResponse.json(updated)
    }

    if (!name || !country) {
      return NextResponse.json(
        { error: 'City name and country are required' },
        { status: 400 }
      )
    }

    let resolvedLat = typeof lat === 'number' ? lat : undefined
    let resolvedLon = typeof lon === 'number' ? lon : undefined

    if ((resolvedLat === undefined || resolvedLon === undefined) && WEATHER_API_KEY) {
      try {
        const query = `${name},${country}`
        const res = await axios.get(`${WEATHER_BASE_URL}/current.json`, { params: { key: WEATHER_API_KEY, q: query } })
        const loc = res.data?.location
        if (loc) { resolvedLat = loc.lat; resolvedLon = loc.lon }
      } catch {}
    }

    if (resolvedLat === undefined || resolvedLon === undefined) { resolvedLat = 0; resolvedLon = 0 }

    const maxOrder = await prisma.city.aggregate({ where: { userId: DEFAULT_USER_ID }, _max: { order: true } })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const city = await prisma.city.upsert({
      where: { name_country: { name, country } },
      update: {},
      create: { name, country, lat: resolvedLat, lon: resolvedLon, userId: DEFAULT_USER_ID, order: nextOrder }
    })

    return NextResponse.json(city, { status: 201 })
  } catch (error: any) {
    console.error('Cities POST error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!canUseDb()) {
      memoryCities = memoryCities.filter(c => c.id !== id)
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'City ID is required' },
        { status: 400 }
      )
    }

    await prisma.city.delete({ where: { id } })

    return NextResponse.json({ message: 'City deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    )
  }
}
