import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Role, Permission, hasPermission } from '@/lib/rbac'
import { Errors } from '@/lib/errors'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['user', 'premium', 'moderator', 'admin']).optional(),
  subscription: z.enum(['free', 'premium']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json(Errors.unauthorized().toJSON(), { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user || !hasPermission(user.role as Role, Permission.MANAGE_USERS)) {
      return NextResponse.json(Errors.forbidden('Admin access required').toJSON(), { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const role = searchParams.get('role')
    const subscription = searchParams.get('subscription')

    // Build where clause with proper typing
    const where: Prisma.UserWhereInput = {}
    if (role) where.role = role
    if (subscription) where.subscription = subscription

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscription: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(Errors.internal().toJSON(), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json(Errors.unauthorized().toJSON(), { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!adminUser || !hasPermission(adminUser.role as Role, Permission.MANAGE_USERS)) {
      return NextResponse.json(Errors.forbidden('Admin access required').toJSON(), { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateUserSchema.parse(body)

    // Prevent admin from demoting themselves
    if (validatedData.userId === session.userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role or subscription' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.subscription && { subscription: validatedData.subscription }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscription: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(Errors.internal().toJSON(), { status: 500 })
  }
}
