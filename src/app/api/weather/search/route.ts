import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const WEATHER_API_KEY = process.env.WEATHERAPI_KEY || ''
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    if (!q) {
      return NextResponse.json([], { status: 200 })
    }
    const res = await axios.get(`${WEATHER_BASE_URL}/search.json`, {
      params: { key: WEATHER_API_KEY, q }
    })
    return NextResponse.json(res.data || [])
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}
