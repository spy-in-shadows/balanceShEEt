'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DollarSign, Package, TrendingUp, MessageSquare } from 'lucide-react'
import Layout from '@/components/Layout'
import ProductsForm from '@/components/ProductsForm'
import TimeSeriesChart from '@/components/TimeSeriesChart'
import TimeRangeToggle from '@/components/TimeRangeToggle'
import KPI from '@/components/KPI'
import ShubhLabhChat from '@/components/ShubhLabhChat'
import ExportButtons from '@/components/ExportButtons'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [granularity, setGranularity] = useState<Granularity>('weekly')
  const [showChat, setShowChat] = useState(false)
  const [forecastData, setForecastData] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: statsData, error: statsError, mutate: mutateStats } = useSWR(
    `/api/stats?granularity=${granularity}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const { data: forecastDataAPI } = useSWR('/api/forecast?method=formula&growth=0.05', fetcher)

  useEffect(() => {
    if (forecastDataAPI) {
      setForecastData(forecastDataAPI.forecast)
    }
  }, [forecastDataAPI])

  if (status === 'loading' || !session) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-bs-primary text-xl">Loading dashboard...</div>
        </div>
      </Layout>
    )
  }

  const summary = statsData?.summary || {
    totalUnits: 0,
    totalRevenue: 0,
    avgUnitPrice: 0,
    uniqueProducts: 0,
  }

  const forecastProgress = forecastData
    ? (summary.totalUnits / forecastData.prediction.units) * 100
    : 0

  return (
    <Layout showAlerts>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-bs-text-strong">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {session.user?.name}!</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="sales" />
            <Button
              onClick={() => setShowChat(!showChat)}
              className="bg-bs-primary hover:bg-bs-primary/90 flex items-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat with Shubh Labh</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPI
            title="Total Revenue"
            value={`$${summary.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            subtitle="Last 90 days"
          />
          <KPI
            title="Units Sold"
            value={summary.totalUnits.toLocaleString()}
            icon={Package}
            subtitle="Last 90 days"
          />
          <KPI
            title="Avg Unit Price"
            value={`$${summary.avgUnitPrice.toFixed(2)}`}
            icon={TrendingUp}
            subtitle="Across all products"
          />
          <KPI
            title="Progress to Forecast"
            value={`${forecastProgress.toFixed(0)}%`}
            icon={TrendingUp}
            subtitle={forecastData ? `Target: ${forecastData.prediction.units} units` : 'Loading...'}
            trend={
              forecastProgress > 0
                ? {
                    value: forecastProgress - 100,
                    isPositive: forecastProgress >= 100,
                  }
                : undefined
            }
          />
        </div>

        {/* Products Form */}
        <ProductsForm onSuccess={() => mutateStats()} />

        {/* Charts */}
        <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-bs-text-strong">Sales & Revenue Trends</h2>
              <p className="text-sm text-gray-500 mt-1">Last 90 days performance</p>
            </div>
            <TimeRangeToggle value={granularity} onChange={setGranularity} />
          </div>
          {statsError ? (
            <div className="flex items-center justify-center h-80 bg-gray-50 rounded-xl">
              <p className="text-red-500">Failed to load chart data</p>
            </div>
          ) : !statsData ? (
            <div className="flex items-center justify-center h-80 bg-gray-50 rounded-xl">
              <div className="animate-pulse text-gray-500">Loading chart...</div>
            </div>
          ) : (
            <TimeSeriesChart data={statsData.series} granularity={granularity} />
          )}
        </div>

        {/* Forecast Explanation */}
        {forecastData && (
          <div className="rounded-2xl shadow-sm p-6 bg-gradient-to-br from-bs-accent/10 to-bs-primary/10 border border-bs-accent">
            <h3 className="text-lg font-semibold text-bs-text-strong mb-3">Sales Forecast Explained</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white/50 p-4 rounded-lg">
              {forecastData.explanation}
            </pre>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && <ShubhLabhChat onClose={() => setShowChat(false)} />}
    </Layout>
  )
}
