'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, TrendingUp, Bell, Bot, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bs-bg">
        <div className="animate-pulse text-bs-primary text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bs-bg">
      <Navbar />
      
      {/* Hero Section - Centered */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center py-16">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-bs-primary/10 mb-6">
              <BarChart3 className="h-10 w-10 text-bs-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-bs-text-strong mb-6">
              BalanceShEEt
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Complete business analytics platform with smart forecasting, real-time alerts, and AI-powered insights
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/auth/login">
                <Button size="lg" className="bg-bs-primary hover:bg-bs-primary/90 text-lg px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid - Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 w-full">
            <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bs-accent/20 mb-4">
                <TrendingUp className="h-6 w-6 text-bs-primary" />
              </div>
              <h3 className="font-semibold text-lg text-bs-text-strong mb-2">Smart Forecasting</h3>
              <p className="text-sm text-gray-600">
                Multiple forecast methods with detailed mathematical explanations
              </p>
            </div>

            <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bs-accent/20 mb-4">
                <Bell className="h-6 w-6 text-bs-primary" />
              </div>
              <h3 className="font-semibold text-lg text-bs-text-strong mb-2">Real-time Alerts</h3>
              <p className="text-sm text-gray-600">
                Intelligent inventory monitoring and critical issue notifications
              </p>
            </div>

            <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bs-accent/20 mb-4">
                <Bot className="h-6 w-6 text-bs-primary" />
              </div>
              <h3 className="font-semibold text-lg text-bs-text-strong mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600">
                Chat with Shubh Labh for instant business insights and analysis
              </p>
            </div>

            <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bs-accent/20 mb-4">
                <BarChart3 className="h-6 w-6 text-bs-primary" />
              </div>
              <h3 className="font-semibold text-lg text-bs-text-strong mb-2">Advanced Analytics</h3>
              <p className="text-sm text-gray-600">
                Interactive charts with daily, weekly, monthly, and yearly views
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-16 p-6 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md">
            <h3 className="font-semibold text-lg text-bs-text-strong mb-3">Try Demo Account</h3>
            <div className="text-left space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> demo@balancesheet.com
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Password:</span> demo123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
