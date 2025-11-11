import { Redis } from '@upstash/redis'

// Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Cache TTLs
export const CACHE_TTL = {
  PRODUCT: 60 * 60, // 1 hour
  FOOTPRINT: 60 * 60 * 24, // 24 hours
  USER: 60 * 15, // 15 minutes
  SEARCH: 60 * 5, // 5 minutes
  ANALYTICS: 60 * 60 * 12, // 12 hours
}

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expires: number }>()

// Clean up expired entries every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expires < now) {
        memoryCache.delete(key)
      }
    }
  }, 60000)
}

// Cache get
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const value = await redis.get(key)
      return value as T | null
    }

    // Fallback to memory cache
    const entry = memoryCache.get(key)
    if (entry && entry.expires > Date.now()) {
      return entry.value as T
    }

    return null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

// Cache set
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.PRODUCT
): Promise<void> {
  try {
    if (redis) {
      await redis.set(key, value, { ex: ttl })
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000,
      })
    }
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

// Cache delete
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key)
    } else {
      memoryCache.delete(key)
    }
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

// Cache delete pattern
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } else {
      // Fallback: delete matching keys from memory cache
      const regex = new RegExp(pattern.replace('*', '.*'))
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key)
        }
      }
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error)
  }
}

// Cache helper for product data
export async function getCachedProduct(upc: string) {
  return cacheGet(`product:${upc}`)
}

export async function setCachedProduct(upc: string, data: any) {
  return cacheSet(`product:${upc}`, data, CACHE_TTL.PRODUCT)
}

export async function invalidateProduct(upc: string) {
  await cacheDelete(`product:${upc}`)
  await cacheDeletePattern(`search:*`) // Invalidate all searches
}

// Cache helper for user data
export async function getCachedUser(userId: string) {
  return cacheGet(`user:${userId}`)
}

export async function setCachedUser(userId: string, data: any) {
  return cacheSet(`user:${userId}`, data, CACHE_TTL.USER)
}

export async function invalidateUser(userId: string) {
  return cacheDelete(`user:${userId}`)
}

// Cache warming (preload common data)
export async function warmCache() {
  // TODO: Implement cache warming for popular products
  console.log('Cache warming...')
}
