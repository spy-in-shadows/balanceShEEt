import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')

    const products = await prisma.product.findMany({
      where: active === 'true' ? { active: true } : undefined,
      include: {
        saleRecords: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sku, category, inventoryOnHand, cost, price } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        inventoryOnHand: inventoryOnHand || 0,
        cost,
        price,
        active: true,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
