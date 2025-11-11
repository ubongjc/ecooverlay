import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role, Permission, hasPermission } from '@/lib/rbac'
import { sanitizeUPC } from '@/lib/security'

const productSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ upc: string }> }
) {
  try {
    const { upc } = await params

    // Validate UPC format
    try {
      sanitizeUPC(upc)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid UPC format' },
        { status: 400 }
      )
    }

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
    // Check authentication and authorization
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user || !hasPermission(user.role as Role, Permission.CREATE_PRODUCTS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { upc } = await params

    // Validate UPC format
    try {
      sanitizeUPC(upc)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid UPC format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Remove empty imageUrl
    const dataToCreate = {
      upc,
      ...validatedData,
      ...(validatedData.imageUrl === '' && { imageUrl: null }),
    }

    const product = await prisma.product.create({
      data: dataToCreate,
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
    // Check authentication and authorization
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user || !hasPermission(user.role as Role, Permission.UPDATE_PRODUCTS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { upc } = await params

    // Validate UPC format
    try {
      sanitizeUPC(upc)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid UPC format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = productSchema.partial().parse(body)

    // Remove empty imageUrl
    const dataToUpdate = {
      ...validatedData,
      ...(validatedData.imageUrl === '' && { imageUrl: null }),
    }

    const product = await prisma.product.update({
      where: { upc },
      data: dataToUpdate,
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
