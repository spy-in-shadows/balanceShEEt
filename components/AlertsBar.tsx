'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle, AlertTriangle, Info, Newspaper } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import useSWR from 'swr'

interface AlertItem {
  id: string
  type: 'critical' | 'warning' | 'info' | 'news'
  title: string
  message: string
  timestamp: Date
  productId?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AlertsBar() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  
  const { data, error } = useSWR<{ alerts: AlertItem[] }>('/api/alerts', fetcher, {
    refreshInterval: 60000, // Poll every 60 seconds
  })

  useEffect(() => {
    // Load dismissed alerts from localStorage
    const dismissed = localStorage.getItem('dismissedAlerts')
    if (dismissed) {
      setDismissedAlerts(new Set(JSON.parse(dismissed)))
    }
  }, [])

  const handleDismiss = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts)
    newDismissed.add(alertId)
    setDismissedAlerts(newDismissed)
    localStorage.setItem('dismissedAlerts', JSON.stringify(Array.from(newDismissed)))
  }

  if (error) return null
  if (!data) return null

  const visibleAlerts = data.alerts.filter(alert => !dismissedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) {
    return (
      <div className="bg-green-50 border-b border-green-200 py-2">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm text-green-700 text-center">✅ No alerts - All systems running smoothly</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 space-y-2">
        {visibleAlerts.slice(0, 5).map(alert => {
          const Icon =
            alert.type === 'critical'
              ? AlertCircle
              : alert.type === 'warning'
              ? AlertTriangle
              : alert.type === 'news'
              ? Newspaper
              : Info

          const variant =
            alert.type === 'critical'
              ? 'destructive'
              : alert.type === 'warning'
              ? 'default'
              : 'default'

          const bgColor =
            alert.type === 'critical'
              ? 'bg-red-50 border-red-200'
              : alert.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : alert.type === 'news'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-blue-50 border-blue-200'

          return (
            <Alert key={alert.id} className={`${bgColor} relative`}>
              <Icon className="h-4 w-4" />
              <AlertTitle className="pr-6">{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )
        })}
      </div>
    </div>
  )
}
