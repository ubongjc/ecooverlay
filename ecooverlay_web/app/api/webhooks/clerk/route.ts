import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  try {
    if (eventType === 'user.created') {
      const { id, email_addresses } = evt.data

      // Check if email_addresses array exists and has at least one email
      if (!email_addresses || email_addresses.length === 0) {
        console.error('No email addresses provided for user.created event')
        return new Response('Error: No email addresses', { status: 400 })
      }

      await prisma.user.create({
        data: {
          id,
          email: email_addresses[0].email_address,
          role: 'user',
          subscription: 'free',
        },
      })
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses } = evt.data

      // Check if email_addresses array exists and has at least one email
      if (!email_addresses || email_addresses.length === 0) {
        console.error('No email addresses provided for user.updated event')
        return new Response('Error: No email addresses', { status: 400 })
      }

      await prisma.user.update({
        where: { id },
        data: {
          email: email_addresses[0].email_address,
        },
      })
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data

      if (id) {
        await prisma.user.delete({
          where: { id },
        })
      }
    }

    return new Response('Webhook received', { status: 200 })
  } catch (error) {
    console.error('Error processing Clerk webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}
