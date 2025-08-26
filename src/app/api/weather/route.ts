import { NextRequest, NextResponse } from 'next/server'
import { getWeatherData } from '@/lib/weather'
import { prisma } from '@/lib/prisma'

function canUseDb() {
  if (process.env.VERCEL) return false
  if (!process.env.DATABASE_URL) return false
  return true
}

function demoStub(city: string, country: string) {
  return {
    current: {
      temp_c: 28,
      feelslike_c: 30,
      humidity: 60,
      wind_kph: 9,
      condition: { text: 'Partly cloudy', code: '1003' }
    },
    forecast: [],
    city: { name: city, country, lat: 0, lon: 0 }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')

    if (!city || !country) {
      return NextResponse.json(
        { error: 'City and country parameters are required' },
        { status: 400 }
      )
    }

    if (process.env.WEATHER_DEMO === '1') {
      return NextResponse.json(demoStub(city, country))
    }

    if (canUseDb()) {
      const now = new Date()
      const cached = await prisma.weatherCache.findFirst({
        where: { cityName: city, country, expiresAt: { gt: now } },
        orderBy: { createdAt: 'desc' }
      })
      if (cached) {
        try { return NextResponse.json(JSON.parse(cached.data)) } catch {}
      }
    }

    const timeoutMs = 2500
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('__timeout__'), timeoutMs))
    const result = await Promise.race([getWeatherData(city, country), timeoutPromise])

    if (result === '__timeout__') {
      return NextResponse.json(demoStub(city, country))
    }

    const weatherData = result as any

    if (canUseDb()) {
      const expires = new Date(Date.now() + 30 * 60 * 1000)
      await prisma.weatherCache.create({
        data: {
          cityName: city,
          country,
          lat: weatherData.city.lat,
          lon: weatherData.city.lon,
          data: JSON.stringify(weatherData),
          expiresAt: expires
        }
      })
    }

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Weather route error:', error)
    return NextResponse.json(demoStub('Unknown', 'NA'))
  }
}
