import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as Papa from 'papaparse'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'sales' // 'sales' or 'products'

    if (type === 'products') {
      const products = await prisma.product.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      })

      if (format === 'csv') {
        const csv = Papa.unparse(products)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="products.csv"',
          },
        })
      }

      return NextResponse.json({ products })
    }

    // Export sales
    const sales = await prisma.saleRecord.findMany({
      include: { product: true },
      orderBy: { date: 'desc' },
      take: 1000, // Limit for performance
    })

    const exportData = sales.map(sale => ({
      date: sale.date.toISOString().split('T')[0],
      product: sale.product.name,
      sku: sale.product.sku || '',
      category: sale.product.category || '',
      unitsSold: sale.unitsSold,
      revenue: sale.revenue,
      unitPrice: sale.revenue / sale.unitsSold,
    }))

    if (format === 'csv') {
      const csv = Papa.unparse(exportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sales-export.csv"',
        },
      })
    }

    return NextResponse.json({ data: exportData })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
