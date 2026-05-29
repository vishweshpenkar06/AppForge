'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Page() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo/Branding */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">
            AppForge
          </h1>
          <p className="text-2xl font-semibold text-gray-300">
            Describe it. Compile it. Ship it.
          </p>
        </div>

        {/* Tagline */}
        <p className="text-lg text-gray-400 leading-relaxed">
          Transform natural language descriptions into production-ready application configurations.
          AppForge uses advanced AI to understand your requirements and generate complete,
          validated blueprints for your next project.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="p-6 bg-[#1a1a1f] border border-gray-800 rounded-lg">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-400">
              Leverages state-of-the-art LLMs to understand complex requirements
            </p>
          </div>
          <div className="p-6 bg-[#1a1a1f] border border-gray-800 rounded-lg">
            <div className="text-3xl mb-3">✓</div>
            <h3 className="font-semibold mb-2">Validated</h3>
            <p className="text-sm text-gray-400">
              Cross-layer consistency checking ensures architectural soundness
            </p>
          </div>
          <div className="p-6 bg-[#1a1a1f] border border-gray-800 rounded-lg">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Production-Ready</h3>
            <p className="text-sm text-gray-400">
              Generate complete schemas, APIs, and component blueprints instantly
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4 pt-8">
          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold"
          >
            Get Started
          </Button>
          <p className="text-sm text-gray-500">
            No credit card required • Free tier available
          </p>
        </div>
      </div>
    </main>
  )
}
