'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface KPIProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function KPI({ title, value, icon: Icon, subtitle, trend }: KPIProps) {
  return (
    <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-bs-text-strong mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="rounded-full bg-bs-accent/20 p-3">
          <Icon className="h-6 w-6 text-bs-primary" />
        </div>
      </div>
    </div>
  )
}
