import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    // In production, include scan history, preferences, etc.
    const userData = {
      user,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }

    return NextResponse.json(userData, {
      headers: {
        'Content-Disposition': `attachment; filename="ecooverlay-data-${userId}.json"`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
