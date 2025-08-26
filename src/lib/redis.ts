import { createClient, RedisClientType } from 'redis'

let client: RedisClientType | null = null
let connecting = false

async function getClient() {
  if (!process.env.REDIS_URL) return null
  if (client) return client
  if (connecting) return null
  try {
    connecting = true
    client = createClient({ url: process.env.REDIS_URL })
    client.on('error', () => {})
    await client.connect()
    return client
  } catch {
    client = null
    return null
  } finally {
    connecting = false
  }
}

export async function redisGet(key: string): Promise<string | null> {
  try {
    const c = await getClient()
    if (!c) return null
    return await c.get(key)
  } catch {
    return null
  }
}

export async function redisSetEx(key: string, ttlSeconds: number, value: string): Promise<void> {
  try {
    const c = await getClient()
    if (!c) return
    await c.setEx(key, ttlSeconds, value)
  } catch {}
}
