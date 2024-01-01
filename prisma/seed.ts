import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { subDays, subMonths } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@balancesheet.com',
      hashedPassword,
    },
  })
  console.log('✅ Created demo user:', user.email)

  // Create 8 demo products with varied characteristics
  const products = [
    {
      name: 'Wireless Headphones',
      sku: 'WH-001',
      category: 'Electronics',
      inventoryOnHand: 25, // Low stock
      cost: 45.0,
      price: 89.99,
      avgDailySales: 3,
      variance: 1.5,
    },
    {
      name: 'Yoga Mat',
      sku: 'YM-002',
      category: 'Fitness',
      inventoryOnHand: 180,
      cost: 12.0,
      price: 29.99,
      avgDailySales: 5,
      variance: 2,
    },
    {
      name: 'Stainless Steel Water Bottle',
      sku: 'WB-003',
      category: 'Accessories',
      inventoryOnHand: 450, // Overstock
      cost: 8.0,
      price: 24.99,
      avgDailySales: 4,
      variance: 2,
    },
    {
      name: 'LED Desk Lamp',
      sku: 'DL-004',
      category: 'Home Office',
      inventoryOnHand: 95,
      cost: 18.0,
      price: 39.99,
      avgDailySales: 2,
      variance: 1,
    },
    {
      name: 'Bluetooth Speaker',
      sku: 'BS-005',
      category: 'Electronics',
      inventoryOnHand: 15, // Critical low
      cost: 35.0,
      price: 79.99,
      avgDailySales: 6,
      variance: 2,
    },
    {
      name: 'Running Shoes',
      sku: 'RS-006',
      category: 'Footwear',
      inventoryOnHand: 75,
      cost: 40.0,
      price: 99.99,
      avgDailySales: 3,
      variance: 1.5,
    },
    {
      name: 'Coffee Maker',
      sku: 'CM-007',
      category: 'Kitchen',
      inventoryOnHand: 10, // Very low, no recent sales
      cost: 55.0,
      price: 129.99,
      avgDailySales: 0.5, // Slow mover
      variance: 0.5,
    },
    {
      name: 'Backpack',
      sku: 'BP-008',
      category: 'Bags',
      inventoryOnHand: 120,
      cost: 25.0,
      price: 59.99,
      avgDailySales: 7, // High velocity
      variance: 3,
    },
  ]

  const createdProducts = []
  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        sku: productData.sku,
        category: productData.category,
        inventoryOnHand: productData.inventoryOnHand,
        cost: productData.cost,
        price: productData.price,
      },
    })
    createdProducts.push({ ...product, ...productData })
    console.log(`✅ Created product: ${product.name}`)
  }

  // Generate 6 months of daily sales data
  console.log('📊 Generating 6 months of sales data...')
  const now = new Date()
  const sixMonthsAgo = subMonths(now, 6)

  let totalRecords = 0
  for (const product of createdProducts) {
    let currentDate = sixMonthsAgo

    // Special case: Coffee Maker - no sales in last 40 days
    const noSalesUntil = product.name === 'Coffee Maker' ? subDays(now, 40) : now

    while (currentDate <= now) {
      // Skip some days randomly (70% chance of sales on any given day)
      if (Math.random() > 0.3 && currentDate <= noSalesUntil) {
        // Generate sales with variance
        const baseUnits = product.avgDailySales
        const variance = product.variance
        const unitsSold = Math.max(
          0,
          Math.round(baseUnits + (Math.random() - 0.5) * 2 * variance)
        )

        if (unitsSold > 0) {
          // Add growth trend for some products (Backpack - high velocity)
          let growthMultiplier = 1
          if (product.name === 'Backpack') {
            const daysFromStart = Math.floor(
              (currentDate.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24)
            )
            growthMultiplier = 1 + (daysFromStart / 180) * 0.5 // 50% growth over 6 months
          }

          const adjustedUnits = Math.round(unitsSold * growthMultiplier)
          const revenue = adjustedUnits * (product.price || 0)

          await prisma.saleRecord.create({
            data: {
              productId: product.id,
              date: new Date(currentDate),
              unitsSold: adjustedUnits,
              revenue,
            },
          })
          totalRecords++
        }
      }

      currentDate = subDays(currentDate, -1) // Move to next day
    }
  }

  console.log(`✅ Created ${totalRecords} sale records`)
  console.log('🎉 Seed completed successfully!')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
