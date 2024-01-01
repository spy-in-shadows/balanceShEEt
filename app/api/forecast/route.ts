import { NextRequest, NextResponse } from 'next/server'
import { forecastFormula, forecastMovingAverage, forecastLinear } from '@/lib/forecast'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const method = searchParams.get('method') || 'formula'
    const productId = searchParams.get('productId') || undefined
    const growthRate = parseFloat(searchParams.get('growth') || '0.05')
    const periods = parseInt(searchParams.get('periods') || '3')

    let result

    switch (method) {
      case 'ma':
        result = await forecastMovingAverage(productId, periods)
        break
      case 'linear':
        result = await forecastLinear(productId)
        break
      case 'formula':
      default:
        result = await forecastFormula(productId, growthRate)
        break
    }

    return NextResponse.json({ forecast: result })
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
