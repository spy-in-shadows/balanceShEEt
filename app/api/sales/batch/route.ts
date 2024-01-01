import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rows } = body

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected { rows: [...] }' },
        { status: 400 }
      )
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const row of rows) {
      try {
        const { productName, date, unitsSold, revenue, inventoryOnHand } = row

        if (!productName || !date || unitsSold === undefined || revenue === undefined) {
          results.errors.push(`Missing required fields in row: ${JSON.stringify(row)}`)
          continue
        }

        // Find or create product
        let product = await prisma.product.findFirst({
          where: { name: productName },
        })

        if (!product) {
          product = await prisma.product.create({
            data: {
              name: productName,
              inventoryOnHand: inventoryOnHand || 0,
              active: true,
            },
          })
        } else if (inventoryOnHand !== undefined) {
          // Update inventory if provided
          product = await prisma.product.update({
            where: { id: product.id },
            data: { inventoryOnHand },
          })
          results.updated++
        }

        // Create sale record
        await prisma.saleRecord.create({
          data: {
            productId: product.id,
            date: new Date(date),
            unitsSold: parseInt(String(unitsSold)),
            revenue: parseFloat(String(revenue)),
          },
        })

        results.created++
      } catch (rowError) {
        console.error('Row processing error:', rowError)
        results.errors.push(`Error processing row: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ results }, { status: 201 })
  } catch (error) {
    console.error('Batch sales error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch sales' },
      { status: 500 }
    )
  }
}
