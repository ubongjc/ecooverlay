import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

// Security headers configuration
export function getSecurityHeaders() {
  const headers = new Headers()

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.*.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://clerk.*.com https://api.stripe.com https://*.sentry.io",
    "frame-src 'self' https://clerk.*.com https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  headers.set('Content-Security-Policy', cspDirectives)

  // Additional security headers
  headers.set('X-DNS-Prefetch-Control', 'on')
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return headers
}

// CORS configuration
export function configureCORS(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://ecooverlay.app',
    'https://www.ecooverlay.app',
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

// Input sanitization helpers
export function sanitizeString(input: string): string {
  // Remove null bytes
  input = input.replace(/\0/g, '')
  
  // Trim whitespace
  input = input.trim()
  
  // Remove control characters except newlines and tabs
  input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  return input
}

export function sanitizeEmail(email: string): string {
  email = sanitizeString(email).toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }
  
  return email
}

export function sanitizeUPC(upc: string): string {
  upc = sanitizeString(upc)
  
  // UPC should be numeric and 12 digits (UPC-A) or 8 digits (UPC-E) or 13 (EAN)
  if (!/^\d{8}$|^\d{12}$|^\d{13}$/.test(upc)) {
    throw new Error('Invalid UPC format')
  }
  
  return upc
}

// SQL Injection protection (Prisma handles this, but extra validation)
export function validateProductName(name: string): string {
  name = sanitizeString(name)
  
  // Max length
  if (name.length > 200) {
    throw new Error('Product name too long')
  }
  
  // Disallow SQL keywords in product names
  const sqlKeywords = ['SELECT', 'DROP', 'DELETE', 'INSERT', 'UPDATE', 'UNION', 'EXEC']
  const upperName = name.toUpperCase()
  
  for (const keyword of sqlKeywords) {
    if (upperName.includes(keyword)) {
      throw new Error('Invalid characters in product name')
    }
  }
  
  return name
}

// XSS Protection
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// CSRF Token validation
export function generateCSRFToken(): string {
  return crypto.randomUUID()
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken
}

// IP address extraction (for rate limiting)
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return 'unknown'
}

// Request logging for audit trail
export interface SecurityLog {
  timestamp: Date
  ip: string
  userId?: string
  action: string
  resource: string
  method: string
  statusCode?: number
  userAgent?: string
  suspicious?: boolean
}

export function logSecurityEvent(log: SecurityLog) {
  // In production, send to logging service (e.g., Sentry, Datadog)
  console.log('[SECURITY]', JSON.stringify(log))
  
  // Flag suspicious activity
  if (log.suspicious) {
    console.error('[SECURITY ALERT]', JSON.stringify(log))
    // TODO: Send alert to security team
  }
}

// Detect suspicious patterns
export function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname

  // Known malicious patterns
  const suspiciousPatterns = [
    /\.\.\//,  // Directory traversal
    /<script/i,  // XSS attempt
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
    /base64_decode/i,  // PHP injection
    /cmd=/i,  // Command injection
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(userAgent)) {
      return true
    }
  }

  return false
}

// Password strength validation (for future use)
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers')
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain special characters')
  }

  // Check against common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// API key validation (for API access)
export function validateAPIKey(apiKey: string): boolean {
  // API key format: eco_live_xxx or eco_test_xxx
  return /^eco_(live|test)_[a-zA-Z0-9]{32}$/.test(apiKey)
}

// Webhook signature validation
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    // Check if lengths match before timing-safe comparison to avoid errors
    if (signature.length !== expectedSignature.length) {
      return false
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    return false
  }
}
