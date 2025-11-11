import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getSecurityHeaders,
  configureCORS,
  getClientIP,
  logSecurityEvent,
  detectSuspiciousActivity
} from '@/lib/security'
import { checkRateLimit, rateLimiters, fallbackLimiters } from '@/lib/ratelimit'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/openapi',
  '/',
])

const isAPIRoute = createRouteMatcher(['/api/(.*)'])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const startTime = Date.now()

  // Get client IP for rate limiting and logging
  const clientIP = getClientIP(request)
  const path = request.nextUrl.pathname
  const method = request.method

  // Detect suspicious activity
  const isSuspicious = detectSuspiciousActivity(request)
  if (isSuspicious) {
    logSecurityEvent({
      timestamp: new Date(),
      ip: clientIP,
      action: 'blocked',
      resource: path,
      method,
      suspicious: true,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { error: 'Forbidden', code: 'SUSPICIOUS_ACTIVITY' },
      { status: 403 }
    )
  }

  // Handle OPTIONS requests for CORS
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    return configureCORS(request, response)
  }

  // Rate limiting for API routes
  if (isAPIRoute(request)) {
    const identifier = `${clientIP}:${path}`
    let rateLimitResult

    // Apply different rate limits based on endpoint
    if (path.includes('/api/auth') || path.includes('/sign-')) {
      rateLimitResult = await checkRateLimit(rateLimiters.auth, identifier)
    } else if (path.includes('/api/export')) {
      rateLimitResult = await checkRateLimit(rateLimiters.export, identifier)
    } else if (path.includes('/api/webhooks')) {
      rateLimitResult = await checkRateLimit(rateLimiters.webhook, identifier)
    } else {
      rateLimitResult = await checkRateLimit(rateLimiters.api, identifier)
    }

    if (!rateLimitResult.success) {
      logSecurityEvent({
        timestamp: new Date(),
        ip: clientIP,
        action: 'rate_limited',
        resource: path,
        method,
        statusCode: 429,
      })

      return NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }

  // Authentication check
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Get user ID if authenticated
  const session = await auth()
  const userId = session?.userId

  // Log request
  if (isAPIRoute(request)) {
    logSecurityEvent({
      timestamp: new Date(),
      ip: clientIP,
      userId,
      action: method.toLowerCase(),
      resource: path,
      method,
      userAgent: request.headers.get('user-agent') || undefined,
    })
  }

  // Continue with request
  const response = NextResponse.next()

  // Add security headers
  const securityHeaders = getSecurityHeaders()
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value)
  })

  // Configure CORS
  const finalResponse = configureCORS(request, response)

  // Add timing header for monitoring
  const duration = Date.now() - startTime
  finalResponse.headers.set('X-Response-Time', `${duration}ms`)

  return finalResponse
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
