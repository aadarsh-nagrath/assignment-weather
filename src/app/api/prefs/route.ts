import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_USER_ID = 'default'

export async function GET() {
  try {
    const pref = await prisma.userPreference.findUnique({ where: { userId: DEFAULT_USER_ID } })
    return NextResponse.json(pref || { units: 'metric', theme: 'neon', mode: 'dark' })
  } catch (e) {
    return NextResponse.json({ units: 'metric', theme: 'neon', mode: 'dark' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { units, theme, mode } = body || {}
    await prisma.user.upsert({ where: { id: DEFAULT_USER_ID }, update: {}, create: { id: DEFAULT_USER_ID, email: 'demo@weather.com', password: 'demo' } })
    const saved = await prisma.userPreference.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: { units, theme, mode },
      create: { userId: DEFAULT_USER_ID, units: units || 'metric', theme: theme || 'neon', mode: mode || 'dark' }
    })
    return NextResponse.json(saved)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
