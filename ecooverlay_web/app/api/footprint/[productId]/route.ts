import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const footprintSchema = z.object({
  scope1: z.number().optional(),
  scope2: z.number().optional(),
  scope3: z.number().optional(),
  totalCo2e: z.number().positive(),
  method: z.string().min(1),
  sources: z.array(z.object({
    name: z.string(),
    url: z.string().url().optional(),
    date: z.string().optional(),
  })),
  confidence: z.number().min(0).max(1).default(0.5),
  uncertainty: z.number().optional(),
  verified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    const footprints = await prisma.footprint.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(footprints)
  } catch (error) {
    console.error('Error fetching footprints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body = await request.json()

    const validatedData = footprintSchema.parse(body)

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const footprint = await prisma.footprint.create({
      data: {
        productId,
        ...validatedData,
        verifiedAt: validatedData.verified ? new Date() : null,
      },
    })

    return NextResponse.json(footprint, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating footprint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
