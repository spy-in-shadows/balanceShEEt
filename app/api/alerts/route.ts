import { NextRequest, NextResponse } from 'next/server'
import { getInventoryAlerts } from '@/lib/alerts/inventory'
import { getNewsAlerts } from '@/lib/alerts/news'

export async function GET(request: NextRequest) {
  try {
    const [inventoryAlerts, newsAlerts] = await Promise.all([
      getInventoryAlerts(),
      getNewsAlerts(),
    ])

    const allAlerts = [...inventoryAlerts, ...newsAlerts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )

    return NextResponse.json({ alerts: allAlerts })
  } catch (error) {
    console.error('Alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
