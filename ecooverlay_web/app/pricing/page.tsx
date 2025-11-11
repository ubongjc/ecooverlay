'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()

  const handleSubscribe = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
          successUrl: window.location.origin + '/dashboard',
          cancelUrl: window.location.origin + '/pricing',
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Start making a difference with every purchase</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Free</h3>
            <div className="text-4xl font-bold mb-4">$0<span className="text-lg">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><span>✓</span> 50 scans/day</li>
              <li className="flex items-center"><span>✓</span> Basic footprint data</li>
              <li className="flex items-center"><span>✓</span> 7-day history</li>
            </ul>
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full py-3 border-2 rounded-lg font-semibold"
            >
              Get Started
            </button>
          </div>

          <div className="bg-green-600 text-white rounded-2xl shadow-2xl p-8 transform scale-105">
            <div className="text-yellow-400 text-sm font-bold mb-2">POPULAR</div>
            <h3 className="text-2xl font-bold mb-4">Premium</h3>
            <div className="text-4xl font-bold mb-4">$2.99<span className="text-lg">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><span>✓</span> Unlimited scans</li>
              <li className="flex items-center"><span>✓</span> Advanced analytics</li>
              <li className="flex items-center"><span>✓</span> API access</li>
              <li className="flex items-center"><span>✓</span> AR features</li>
              <li className="flex items-center"><span>✓</span> Priority support</li>
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-50"
            >
              {isLoading ? 'Loading...' : 'Subscribe Now'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <div className="text-4xl font-bold mb-4">Custom</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center"><span>✓</span> Everything in Premium</li>
              <li className="flex items-center"><span>✓</span> Unlimited API</li>
              <li className="flex items-center"><span>✓</span> White-label options</li>
              <li className="flex items-center"><span>✓</span> SLA guarantees</li>
            </ul>
            <button
              onClick={() => window.location.href = 'mailto:enterprise@ecooverlay.app'}
              className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
