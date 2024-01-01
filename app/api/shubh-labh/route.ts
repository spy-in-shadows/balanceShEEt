import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subMonths } from 'date-fns'
import { forecastFormula } from '@/lib/forecast'
import { getInventoryAlerts } from '@/lib/alerts/inventory'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const lowerMessage = message.toLowerCase()

    // Rule-based responses
    let response = ''

    // Top products query
    if (lowerMessage.includes('top') && (lowerMessage.includes('5') || lowerMessage.includes('products'))) {
      const lastMonth = subMonths(new Date(), 1)
      const sales = await prisma.saleRecord.findMany({
        where: { date: { gte: lastMonth } },
        include: { product: true },
      })

      const productRevenue = new Map<string, { name: string; revenue: number; units: number }>()
      sales.forEach(sale => {
        const existing = productRevenue.get(sale.productId) || {
          name: sale.product.name,
          revenue: 0,
          units: 0,
        }
        productRevenue.set(sale.productId, {
          name: existing.name,
          revenue: existing.revenue + sale.revenue,
          units: existing.units + sale.unitsSold,
        })
      })

      const top5 = Array.from(productRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      response = `**Top 5 Products by Revenue (Last Month)**\n\n${top5
        .map(
          (p, i) =>
            `${i + 1}. **${p.name}**: $${p.revenue.toFixed(2)} (${p.units} units sold)`
        )
        .join('\n')}\n\nThese products are your top performers! Consider increasing inventory or running promotions.`
    }
    // Forecast query
    else if (lowerMessage.includes('forecast') || lowerMessage.includes('predict')) {
      const forecast = await forecastFormula(undefined, 0.05)
      response = `**Sales Forecast**\n\n${forecast.explanation}\n\n**Next Period Prediction:**\n- Units: ${forecast.prediction.units}\n- Revenue: $${forecast.prediction.revenue}\n- Confidence Range: ${forecast.confidence.low} - ${forecast.confidence.high} units`
    }
    // Alerts query
    else if (lowerMessage.includes('alert') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      const alerts = await getInventoryAlerts()
      const criticalAlerts = alerts.filter(a => a.type === 'critical')
      const warningAlerts = alerts.filter(a => a.type === 'warning')

      if (alerts.length === 0) {
        response = '**No Current Alerts** ✅\n\nAll systems are running smoothly! Your inventory levels look good.'
      } else {
        response = `**Current Alerts Summary**\n\n`
        if (criticalAlerts.length > 0) {
          response += `🚨 **Critical Issues (${criticalAlerts.length}):**\n${criticalAlerts
            .map(a => `- ${a.title}: ${a.message}`)
            .join('\n')}\n\n`
        }
        if (warningAlerts.length > 0) {
          response += `⚠️ **Warnings (${warningAlerts.length}):**\n${warningAlerts
            .slice(0, 3)
            .map(a => `- ${a.title}}`)
            .join('\n')}\n\n`
        }
        response += `I recommend addressing critical alerts immediately to avoid stockouts.`
      }
    }
    // Sales summary
    else if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('summary')) {
      const lastMonth = subMonths(new Date(), 1)
      const sales = await prisma.saleRecord.findMany({
        where: { date: { gte: lastMonth } },
      })

      const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0)
      const totalUnits = sales.reduce((sum, s) => sum + s.unitsSold, 0)
      const avgOrderValue = totalRevenue / (sales.length || 1)

      response = `**Last Month Sales Summary**\n\n- **Total Revenue:** $${totalRevenue.toFixed(2)}\n- **Units Sold:** ${totalUnits}\n- **Number of Transactions:** ${sales.length}\n- **Average Order Value:** $${avgOrderValue.toFixed(2)}\n\nYour business is performing well! Keep up the momentum.`
    }
    // Default response
    else {
      response = `Hello! I'm **Shubh Labh**, your business analytics assistant. 🎯\n\nI can help you with:\n- **Top products** analysis\n- **Sales forecasting** and predictions\n- **Inventory alerts** and issues\n- **Revenue summaries** and trends\n\nTry asking me:\n- "Show me the top 5 products"\n- "What's the sales forecast?"\n- "Any alerts or issues?"\n- "Give me a sales summary"`
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Shubh Labh error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
