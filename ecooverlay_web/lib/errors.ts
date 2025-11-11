// Standard error codes
export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  
  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_UPC = 'INVALID_UPC',
  INVALID_EMAIL = 'INVALID_EMAIL',
  
  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Payment errors (402)
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  
  // Security errors
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
}

// Application error class
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
      timestamp: new Date().toISOString(),
    }
  }
}

// Error factory functions
export const Errors = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Forbidden') =>
    new AppError(ErrorCode.FORBIDDEN, message, 403),

  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),

  validation: (message: string, details?: any) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  rateLimited: (retryAfter?: number) =>
    new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests',
      429,
      { retryAfter }
    ),

  paymentRequired: (message = 'Payment required') =>
    new AppError(ErrorCode.PAYMENT_REQUIRED, message, 402),

  internal: (message = 'Internal server error') =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500),

  subscriptionRequired: (feature: string) =>
    new AppError(
      ErrorCode.SUBSCRIPTION_REQUIRED,
      `Premium subscription required for ${feature}`,
      403
    ),
}

// Error handler middleware
export function handleError(error: unknown) {
  // Log error
  console.error('[ERROR]', error)

  // Handle AppError
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: error.toJSON(),
    }
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any

    if (prismaError.code === 'P2002') {
      return {
        status: 409,
        body: {
          error: 'Resource already exists',
          code: 'DUPLICATE_ENTRY',
          timestamp: new Date().toISOString(),
        },
      }
    }

    if (prismaError.code === 'P2025') {
      return {
        status: 404,
        body: {
          error: 'Resource not found',
          code: ErrorCode.NOT_FOUND,
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  // Handle unknown errors
  return {
    status: 500,
    body: {
      error: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
    },
  }
}

// Async error wrapper for route handlers
export function asyncHandler(
  handler: (req: any, context?: any) => Promise<Response>
) {
  return async (req: any, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      const { status, body } = handleError(error)
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}

// Sentry integration helper
export function captureError(error: Error, context?: any) {
  // In production, send to Sentry
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // TODO: Integrate with Sentry SDK
    console.log('[SENTRY]', error, context)
  } else {
    console.error('[ERROR]', error, context)
  }
}
