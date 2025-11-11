import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  brand: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    }

    const validatedParams = searchSchema.parse(params)

    // Build where clause
    const where: any = {
      OR: [
        { name: { contains: validatedParams.q, mode: 'insensitive' } },
        { brand: { contains: validatedParams.q, mode: 'insensitive' } },
        { upc: { contains: validatedParams.q } },
      ],
    }

    if (validatedParams.category) {
      where.category = validatedParams.category
    }

    if (validatedParams.brand) {
      where.brand = validatedParams.brand
    }

    // Execute search with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          footprints: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        take: validatedParams.limit,
        skip: validatedParams.offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        total,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: validatedParams.offset + validatedParams.limit < total,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
