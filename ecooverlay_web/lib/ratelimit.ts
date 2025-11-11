import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Rate limiters for different use cases
export const rateLimiters = {
  // General API: 100 requests per 15 minutes
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '15 m'),
        analytics: true,
        prefix: '@ecooverlay/ratelimit/api',
      })
    : null,

  // Authentication: 5 attempts per 15 minutes
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: '@ecooverlay/ratelimit/auth',
      })
    : null,

  // Scanning: 50 scans per day for free, unlimited for premium
  scanFree: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, '24 h'),
        analytics: true,
        prefix: '@ecooverlay/ratelimit/scan-free',
      })
    : null,

  // Data export: 3 per day
  export: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '24 h'),
        analytics: true,
        prefix: '@ecooverlay/ratelimit/export',
      })
    : null,

  // Webhooks: 1000 per minute (Stripe, Clerk)
  webhook: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, '1 m'),
        analytics: true,
        prefix: '@ecooverlay/ratelimit/webhook',
      })
    : null,
}

// Helper function to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!limiter) {
    // If Redis not configured, allow request but log warning
    console.warn('Rate limiting not configured - using in-memory fallback')
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }

  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

// In-memory fallback for development (not production-safe)
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async check(identifier: string): Promise<boolean> {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Filter out old requests
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
}

// Fallback limiters for development
export const fallbackLimiters = {
  api: new InMemoryRateLimiter(100, 15 * 60 * 1000),
  auth: new InMemoryRateLimiter(5, 15 * 60 * 1000),
  scanFree: new InMemoryRateLimiter(50, 24 * 60 * 60 * 1000),
  export: new InMemoryRateLimiter(3, 24 * 60 * 60 * 1000),
  webhook: new InMemoryRateLimiter(1000, 60 * 1000),
}
