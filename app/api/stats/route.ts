import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, format } from 'date-fns'

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly'

function getBucketKey(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'daily':
      return format(date, 'yyyy-MM-dd')
    case 'weekly':
      return format(startOfWeek(date), 'yyyy-MM-dd')
    case 'monthly':
      return format(startOfMonth(date), 'yyyy-MM')
    case 'yearly':
      return format(startOfYear(date), 'yyyy')
    default:
      return format(date, 'yyyy-MM-dd')
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const granularity = (searchParams.get('granularity') || 'weekly') as Granularity
    const productId = searchParams.get('productId') || undefined
    
    // Default to last 90 days
    const endDate = new Date()
    const startDate = searchParams.get('start')
      ? new Date(searchParams.get('start')!)
      : subDays(endDate, 90)
    const end = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : endDate

    // Fetch sales records
    const sales = await prisma.saleRecord.findMany({
      where: {
        ...(productId && { productId }),
        date: {
          gte: startDate,
          lte: end,
        },
      },
      include: {
        product: true,
      },
      orderBy: { date: 'asc' },
    })

    // Aggregate by time bucket
    const buckets = new Map<string, { units: number; revenue: number; date: Date }>()

    sales.forEach(sale => {
      const bucketKey = getBucketKey(sale.date, granularity)
      const existing = buckets.get(bucketKey) || { units: 0, revenue: 0, date: sale.date }
      buckets.set(bucketKey, {
        units: existing.units + sale.unitsSold,
        revenue: existing.revenue + sale.revenue,
        date: existing.date,
      })
    })

    const series = Array.from(buckets.entries())
      .map(([key, data]) => ({
        date: key,
        units: data.units,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate totals and KPIs
    const totalUnits = sales.reduce((sum, s) => sum + s.unitsSold, 0)
    const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0)
    const avgUnitPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0

    // Get unique products count
    const uniqueProducts = new Set(sales.map(s => s.productId)).size

    return NextResponse.json({
      series,
      summary: {
        totalUnits,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgUnitPrice: Math.round(avgUnitPrice * 100) / 100,
        uniqueProducts,
        periodStart: startDate.toISOString(),
        periodEnd: end.toISOString(),
        granularity,
      },
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
