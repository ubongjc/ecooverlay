import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    const alternatives = await prisma.altSuggestion.findMany({
      where: { productId },
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
    })

    return NextResponse.json(alternatives)
  } catch (error) {
    console.error('Error fetching alternatives:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
