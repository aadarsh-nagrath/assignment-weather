import axios from 'axios'
import { redisGet, redisSetEx } from './redis'
import https from 'https'

const WEATHER_API_KEY = process.env.WEATHERAPI_KEY || 'your_weatherapi_key_here'
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

const ipv4Agent = new https.Agent({ family: 4, keepAlive: true })

export interface WeatherData {
  current: any
  forecast: any[]
  city: { name: string; country: string; lat: number; lon: number }
}

async function resolveQuery(city: string, country: string) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 2500)
  try {
    const res = await fetch(`${WEATHER_BASE_URL}/search.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(`${city}`)}`, { signal: controller.signal, cache: 'no-store' })
    const list = await res.json()
    if (Array.isArray(list) && list.length) {
      const best = list.find((x: any) => x.name?.toLowerCase() === city.toLowerCase()) || list[0]
      const cc = best?.country_code || best?.country || ''
      clearTimeout(t)
      return `${best?.name || city},${(cc || country).slice(0, 2)}`
    }
  } catch {}
  clearTimeout(t)
  const cc = country && country.length <= 3 ? country : ''
  return cc ? `${city},${cc}` : city
}

export async function getWeatherData(city: string, country: string): Promise<WeatherData> {
  const cacheKey = `weather:${city}:${country}`
  try {
    const cached = await redisGet(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  const q = await resolveQuery(city, country)
  const shortCfg = { timeout: 4000 as number, httpsAgent: ipv4Agent }

  try {
    const currentResponse = await axios.get(`${WEATHER_BASE_URL}/current.json`, { params: { key: WEATHER_API_KEY, q, aqi: 'yes' }, ...shortCfg })
    if (!currentResponse.data) throw new Error('no_current')
    const currentData = currentResponse.data
    let forecastDays: any[] = []
    try {
      const forecastResponse = await axios.get(`${WEATHER_BASE_URL}/forecast.json`, { params: { key: WEATHER_API_KEY, q, days: 5, aqi: 'yes' }, ...shortCfg })
      forecastDays = forecastResponse.data?.forecast?.forecastday || []
    } catch {}

    const weatherData: WeatherData = {
      current: currentData.current,
      forecast: forecastDays,
      city: {
        name: currentData.location?.name || city,
        country: currentData.location?.country || country,
        lat: currentData.location?.lat || 0,
        lon: currentData.location?.lon || 0
      }
    }

    try { await redisSetEx(cacheKey, 1800, JSON.stringify(weatherData)) } catch {}
    return weatherData
  } catch (error) {
    console.error('Weather API error:', error)
    throw new Error(`timeout_or_error:${(error as any)?.message || 'unknown'}`)
  }
}

export function getWeatherIcon(condition: string): string {
  const iconMap: { [key: string]: string } = { '1000': '☀️', '1003': '⛅', '1006': '☁️', '1009': '☁️', '1030': '🌫️', '1063': '🌦️', '1066': '🌨️', '1069': '🌨️', '1087': '⛈️', '1114': '🌨️', '1117': '❄️', '1135': '🌫️', '1147': '🌫️', '1150': '🌧️', '1153': '🌧️', '1168': '🌧️', '1171': '🌧️', '1180': '🌦️', '1183': '🌧️', '1186': '🌧️', '1189': '🌧️', '1192': '🌧️', '1195': '🌧️', '1198': '🌧️', '1201': '🌧️', '1204': '🌨️', '1207': '🌨️', '1210': '🌨️', '1213': '🌨️', '1216': '🌨️', '1219': '🌨️', '1222': '❄️', '1225': '❄️', '1237': '🌨️', '1240': '🌦️', '1243': '🌧️', '1246': '🌧️', '1249': '🌨️', '1252': '🌨️', '1255': '🌨️', '1258': '🌨️', '1261': '🌨️', '1264': '🌨️', '1273': '🌦️', '1276': '⛈️', '1279': '🌨️', '1282': '❄️' }
  return iconMap[condition] || '🌤️'
}
