'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TimeSeriesChartProps {
  data: Array<{
    date: string
    units: number
    revenue: number
  }>
  granularity: string
}

export default function TimeSeriesChart({ data, granularity }: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-xl">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          stroke="#006E6D"
          tick={{ fontSize: 12 }}
          label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#8FD3C7"
          tick={{ fontSize: 12 }}
          label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px'
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="units" 
          stroke="#006E6D" 
          strokeWidth={2}
          dot={{ fill: '#006E6D', r: 3 }}
          activeDot={{ r: 5 }}
          name="Units Sold"
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="revenue" 
          stroke="#8FD3C7" 
          strokeWidth={2}
          dot={{ fill: '#8FD3C7', r: 3 }}
          activeDot={{ r: 5 }}
          name="Revenue ($)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
