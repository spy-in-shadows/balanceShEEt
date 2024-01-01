import { prisma } from './db'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

export interface ForecastResult {
  method: 'formula' | 'ma' | 'linear'
  usedPeriods: number
  previousPeriodSales: number
  prediction: {
    units: number
    revenue: number
  }
  confidence: {
    low: number
    high: number
  }
  explanation: string
}

interface MonthlySales {
  month: Date
  units: number
  revenue: number
}

async function getMonthlyAggregates(
  productId?: string,
  months: number = 6
): Promise<MonthlySales[]> {
  const now = new Date()
  const startDate = subMonths(startOfMonth(now), months)

  const sales = await prisma.saleRecord.findMany({
    where: {
      ...(productId ? { productId } : {}),
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  })

  // Group by month
  const monthlyMap = new Map<string, { units: number; revenue: number }>()

  sales.forEach(sale => {
    const monthKey = `${sale.date.getFullYear()}-${String(sale.date.getMonth() + 1).padStart(2, '0')}`
    const existing = monthlyMap.get(monthKey) || { units: 0, revenue: 0 }
    monthlyMap.set(monthKey, {
      units: existing.units + sale.unitsSold,
      revenue: existing.revenue + sale.revenue,
    })
  })

  return Array.from(monthlyMap.entries())
    .map(([key, data]) => ({
      month: new Date(key + '-01'),
      units: data.units,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.month.getTime() - b.month.getTime())
}

export async function forecastFormula(
  productId?: string,
  growthRate: number = 0.05
): Promise<ForecastResult> {
  const monthlyData = await getMonthlyAggregates(productId, 6)

  if (monthlyData.length === 0) {
    return {
      method: 'formula',
      usedPeriods: 0,
      previousPeriodSales: 0,
      prediction: { units: 0, revenue: 0 },
      confidence: { low: 0, high: 0 },
      explanation: 'No sales data available for forecasting.',
    }
  }

  const lastPeriod = monthlyData[monthlyData.length - 1]
  const predictedUnits = lastPeriod.units * (1 + growthRate)
  const predictedRevenue = lastPeriod.revenue * (1 + growthRate)

  return {
    method: 'formula',
    usedPeriods: monthlyData.length,
    previousPeriodSales: lastPeriod.units,
    prediction: {
      units: Math.round(predictedUnits),
      revenue: Math.round(predictedRevenue * 100) / 100,
    },
    confidence: {
      low: Math.round(predictedUnits * 0.85),
      high: Math.round(predictedUnits * 1.15),
    },
    explanation: `Formula-based forecast: Forecast = Previous Period Sales × (1 + Growth Rate)\n\nCalculation:\n- Previous Period Sales: ${lastPeriod.units} units\n- Growth Rate: ${(growthRate * 100).toFixed(1)}%\n- Forecast = ${lastPeriod.units} × (1 + ${growthRate}) = ${Math.round(predictedUnits)} units\n- Revenue Forecast = $${lastPeriod.revenue.toFixed(2)} × (1 + ${growthRate}) = $${predictedRevenue.toFixed(2)}\n\nThis assumes sales will grow at a constant rate of ${(growthRate * 100).toFixed(1)}% based on the most recent month's performance.`,
  }
}

export async function forecastMovingAverage(
  productId?: string,
  periods: number = 3
): Promise<ForecastResult> {
  const monthlyData = await getMonthlyAggregates(productId, 6)

  if (monthlyData.length < periods) {
    return {
      method: 'ma',
      usedPeriods: monthlyData.length,
      previousPeriodSales: 0,
      prediction: { units: 0, revenue: 0 },
      confidence: { low: 0, high: 0 },
      explanation: `Insufficient data for ${periods}-period moving average. Need at least ${periods} months of data.`,
    }
  }

  const recentPeriods = monthlyData.slice(-periods)
  const avgUnits = recentPeriods.reduce((sum, p) => sum + p.units, 0) / periods
  const avgRevenue = recentPeriods.reduce((sum, p) => sum + p.revenue, 0) / periods

  // Calculate standard deviation for confidence interval
  const stdDevUnits = Math.sqrt(
    recentPeriods.reduce((sum, p) => sum + Math.pow(p.units - avgUnits, 2), 0) / periods
  )

  return {
    method: 'ma',
    usedPeriods: periods,
    previousPeriodSales: monthlyData[monthlyData.length - 1].units,
    prediction: {
      units: Math.round(avgUnits),
      revenue: Math.round(avgRevenue * 100) / 100,
    },
    confidence: {
      low: Math.round(avgUnits - stdDevUnits),
      high: Math.round(avgUnits + stdDevUnits),
    },
    explanation: `Moving Average Forecast (${periods} periods):\n\nCalculation:\n${recentPeriods.map((p, i) => `- Month ${i + 1}: ${p.units} units, $${p.revenue.toFixed(2)}`).join('\n')}\n\nAverage = (${recentPeriods.map(p => p.units).join(' + ')}) / ${periods} = ${Math.round(avgUnits)} units\nRevenue Average = $${avgRevenue.toFixed(2)}\n\nThis method smooths out short-term fluctuations by averaging the last ${periods} months of sales.`,
  }
}

export async function forecastLinear(productId?: string): Promise<ForecastResult> {
  const monthlyData = await getMonthlyAggregates(productId, 6)

  if (monthlyData.length < 3) {
    return {
      method: 'linear',
      usedPeriods: monthlyData.length,
      previousPeriodSales: 0,
      prediction: { units: 0, revenue: 0 },
      confidence: { low: 0, high: 0 },
      explanation: 'Insufficient data for linear regression. Need at least 3 months of data.',
    }
  }

  // Linear regression: y = mx + b
  const n = monthlyData.length
  const x = monthlyData.map((_, i) => i)
  const y = monthlyData.map(d => d.units)
  const yRevenue = monthlyData.map(d => d.revenue)

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Predict next period (n)
  const predictedUnits = slope * n + intercept

  // Same for revenue
  const sumYRevenue = yRevenue.reduce((a, b) => a + b, 0)
  const sumXYRevenue = x.reduce((sum, xi, i) => sum + xi * yRevenue[i], 0)
  const slopeRevenue = (n * sumXYRevenue - sumX * sumYRevenue) / (n * sumX2 - sumX * sumX)
  const interceptRevenue = (sumYRevenue - slopeRevenue * sumX) / n
  const predictedRevenue = slopeRevenue * n + interceptRevenue

  // Calculate R-squared for confidence
  const yMean = sumY / n
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * i + intercept), 2), 0)
  const rSquared = 1 - ssResidual / ssTotal

  const confidenceMargin = Math.abs(predictedUnits * (1 - rSquared) * 0.5)

  return {
    method: 'linear',
    usedPeriods: n,
    previousPeriodSales: monthlyData[n - 1].units,
    prediction: {
      units: Math.max(0, Math.round(predictedUnits)),
      revenue: Math.max(0, Math.round(predictedRevenue * 100) / 100),
    },
    confidence: {
      low: Math.max(0, Math.round(predictedUnits - confidenceMargin)),
      high: Math.round(predictedUnits + confidenceMargin),
    },
    explanation: `Linear Regression Forecast:\n\nUsing least-squares method on ${n} months of data:\n- Equation: y = mx + b\n- Slope (m): ${slope.toFixed(2)} units/month\n- Intercept (b): ${intercept.toFixed(2)}\n- R² (fit quality): ${(rSquared * 100).toFixed(1)}%\n\nPrediction for next period:\n- Units = ${slope.toFixed(2)} × ${n} + ${intercept.toFixed(2)} = ${Math.round(predictedUnits)} units\n- Revenue = $${predictedRevenue.toFixed(2)}\n\nThis method identifies the trend line through historical data. ${rSquared > 0.7 ? 'High R² indicates strong predictive power.' : 'Lower R² suggests more variability in the data.'}`,
  }
}
