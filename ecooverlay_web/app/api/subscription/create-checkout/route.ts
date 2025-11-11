import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const allowedDomains = [
  'ecooverlay.app',
  'www.ecooverlay.app',
  'localhost:3000',
]

// Validate that URLs are safe and not open redirect vulnerabilities
function validateUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback

  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname

    // Check if the domain is in our allowed list
    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      console.warn(`Rejected URL with unauthorized domain: ${hostname}`)
      return fallback
    }

    return url
  } catch (error) {
    console.error('Invalid URL provided:', error)
    return fallback
  }
}

const checkoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = checkoutSchema.parse(body)

    // Validate and sanitize URLs to prevent open redirect vulnerabilities
    const defaultSuccessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`
    const defaultCancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`

    const safeSuccessUrl = validateUrl(validatedData.successUrl, defaultSuccessUrl)
    const safeCancelUrl = validateUrl(validatedData.cancelUrl, defaultCancelUrl)

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: validatedData.priceId,
          quantity: 1,
        },
      ],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
