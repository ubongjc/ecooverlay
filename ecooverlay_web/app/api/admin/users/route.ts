import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Role, Permission, hasPermission } from '@/lib/rbac'
import { Errors } from '@/lib/errors'

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
    const limit = parseInt(searchParams.get('limit') || '50')
    const role = searchParams.get('role')
    const subscription = searchParams.get('subscription')

    const where: any = {}
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

    const { userId, role, subscription } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(subscription && { subscription }),
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
    console.error('Error updating user:', error)
    return NextResponse.json(Errors.internal().toJSON(), { status: 500 })
  }
}
