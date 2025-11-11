import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('checkout.session.completed: Missing userId in metadata')
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        if (!session.subscription) {
          console.error('checkout.session.completed: Missing subscription')
          return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
        }

        // Check if user exists before updating
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
          console.error(`checkout.session.completed: User ${userId} not found`)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscription: 'premium',
            role: 'premium',
          },
        })

        console.log(`User ${userId} upgraded to premium`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('customer.subscription.updated: Missing userId in metadata')
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        // Check if user exists before updating
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
          console.error(`customer.subscription.updated: User ${userId} not found`)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const isActive = subscription.status === 'active'
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscription: isActive ? 'premium' : 'free',
            role: isActive ? 'premium' : 'user',
          },
        })

        console.log(`User ${userId} subscription status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('customer.subscription.deleted: Missing userId in metadata')
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        // Check if user exists before updating
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
          console.error(`customer.subscription.deleted: User ${userId} not found`)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscription: 'free',
            role: 'user',
          },
        })

        console.log(`User ${userId} subscription cancelled`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
