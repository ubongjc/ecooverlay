import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ upc: string }> }
) {
  try {
    const { upc } = await params
    
    const product = await prisma.product.findUnique({
      where: { upc },
      include: {
        footprints: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        alternatives: {
          include: {
            altProduct: {
              include: {
                footprints: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { carbonDelta: 'asc' },
          take: 5,
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ upc: string }> }
) {
  try {
    const { upc } = await params
    const body = await request.json()

    const validatedData = productSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        upc,
        ...validatedData,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ upc: string }> }
) {
  try {
    const { upc } = await params
    const body = await request.json()

    const validatedData = productSchema.partial().parse(body)

    const product = await prisma.product.update({
      where: { upc },
      data: validatedData,
    })

    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
