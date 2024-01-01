import { prisma } from '../db'
import { subDays } from 'date-fns'

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'news'
  title: string
  message: string
  timestamp: Date
  productId?: string
}

export async function getInventoryAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = []
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sixtyDaysAgo = subDays(now, 60)

  // Get all active products
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      saleRecords: {
        where: {
          date: { gte: sixtyDaysAgo },
        },
        orderBy: { date: 'desc' },
      },
    },
  })

  // Calculate inventory statistics
  const inventoryLevels = products.map(p => p.inventoryOnHand).sort((a, b) => a - b)
  const p90Index = Math.floor(inventoryLevels.length * 0.9)
  const overstockThreshold = inventoryLevels[p90Index] || 1000

  for (const product of products) {
    // Get last 30 days sales
    const last30DaySales = product.saleRecords.filter(
      sale => sale.date >= thirtyDaysAgo
    )
    const prev30DaySales = product.saleRecords.filter(
      sale => sale.date >= sixtyDaysAgo && sale.date < thirtyDaysAgo
    )

    const totalUnitsLast30Days = last30DaySales.reduce((sum, s) => sum + s.unitsSold, 0)
    const totalUnitsPrev30Days = prev30DaySales.reduce((sum, s) => sum + s.unitsSold, 0)
    const avgDailySales = totalUnitsLast30Days / 30

    // Critical: Low inventory
    if (avgDailySales > 0) {
      const daysLeft = product.inventoryOnHand / avgDailySales
      if (daysLeft < 10) {
        alerts.push({
          id: `critical-${product.id}`,
          type: 'critical',
          title: `Critical: Low Stock - ${product.name}`,
          message: `Only ${Math.round(daysLeft)} days of inventory remaining (${product.inventoryOnHand} units). Avg daily sales: ${avgDailySales.toFixed(1)} units.`,
          timestamp: now,
          productId: product.id,
        })
      }
    }

    // Warning: No recent sales
    const lastSale = product.saleRecords[0]
    if (!lastSale || lastSale.date < thirtyDaysAgo) {
      const daysSinceLastSale = lastSale
        ? Math.floor((now.getTime() - lastSale.date.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      alerts.push({
        id: `warning-stale-${product.id}`,
        type: 'warning',
        title: `Warning: No Recent Sales - ${product.name}`,
        message: `No sales recorded in the last ${Math.min(daysSinceLastSale, 30)} days. Current inventory: ${product.inventoryOnHand} units.`,
        timestamp: now,
        productId: product.id,
      })
    }

    // Warning: Overstock
    if (product.inventoryOnHand > overstockThreshold && product.inventoryOnHand > 100) {
      alerts.push({
        id: `warning-overstock-${product.id}`,
        type: 'warning',
        title: `Warning: Overstock - ${product.name}`,
        message: `Inventory (${product.inventoryOnHand} units) is in the top 10% across all products. Consider promotions or discounts.`,
        timestamp: now,
        productId: product.id,
      })
    }

    // Info: High velocity
    if (totalUnitsPrev30Days > 0) {
      const growthRate = (totalUnitsLast30Days - totalUnitsPrev30Days) / totalUnitsPrev30Days
      if (growthRate > 0.3) {
        alerts.push({
          id: `info-velocity-${product.id}`,
          type: 'info',
          title: `High Growth: ${product.name}`,
          message: `Sales increased by ${(growthRate * 100).toFixed(1)}% compared to previous period. Last 30 days: ${totalUnitsLast30Days} units, Previous: ${totalUnitsPrev30Days} units.`,
          timestamp: now,
          productId: product.id,
        })
      }
    }
  }

  return alerts
}
