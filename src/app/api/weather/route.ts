import { NextRequest, NextResponse } from 'next/server'
import { getWeatherData } from '@/lib/weather'
import { prisma } from '@/lib/prisma'

function canUseDb() {
  if (process.env.VERCEL) return false
  if (!process.env.DATABASE_URL) return false
  return true
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

    const weatherData = await getWeatherData(city, country)

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
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
