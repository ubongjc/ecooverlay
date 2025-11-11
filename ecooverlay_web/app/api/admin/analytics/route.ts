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

    if (!user || !hasPermission(user.role as Role, Permission.READ_ALL_ANALYTICS)) {
      return NextResponse.json(Errors.forbidden('Admin access required').toJSON(), { status: 403 })
    }

    const [
      totalUsers,
      totalProducts,
      totalFootprints,
      premiumUsers,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.footprint.count(),
      prisma.user.count({ where: { subscription: 'premium' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ])

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = premiumUsers * 2.99

    // Get user growth by month
    const usersByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM users
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `

    return NextResponse.json({
      overview: {
        totalUsers,
        totalProducts,
        totalFootprints,
        premiumUsers,
        recentUsers,
        mrr,
        conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0,
      },
      growth: {
        usersByMonth: usersByMonth.map(row => ({
          month: row.month,
          count: Number(row.count),
        })),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(Errors.internal().toJSON(), { status: 500 })
  }
}
