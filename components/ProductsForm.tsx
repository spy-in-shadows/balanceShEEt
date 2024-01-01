'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ProductRow {
  id: string
  productName: string
  date: string
  unitsSold: string
  revenue: string
  inventoryOnHand: string
}

interface ProductsFormProps {
  onSuccess?: () => void
}

export default function ProductsForm({ onSuccess }: ProductsFormProps) {
  const { toast } = useToast()
  const [rows, setRows] = useState<ProductRow[]>([
    {
      id: '1',
      productName: '',
      date: new Date().toISOString().split('T')[0],
      unitsSold: '',
      revenue: '',
      inventoryOnHand: '',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [productSuggestions, setProductSuggestions] = useState<string[]>([])

  useEffect(() => {
    // Fetch existing products for autocomplete
    fetch('/api/products?active=true')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProductSuggestions(data.products.map((p: any) => p.name))
        }
      })
      .catch(console.error)
  }, [])

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        productName: '',
        date: new Date().toISOString().split('T')[0],
        unitsSold: '',
        revenue: '',
        inventoryOnHand: '',
      },
    ])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof ProductRow, value: string) => {
    setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleSaveAll = async () => {
    // Validate all rows
    const validRows = rows.filter(
      row => row.productName && row.date && row.unitsSold && row.revenue
    )

    if (validRows.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in at least one complete row with product name, date, units, and revenue.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/sales/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map(row => ({
            productName: row.productName,
            date: row.date,
            unitsSold: parseInt(row.unitsSold),
            revenue: parseFloat(row.revenue),
            inventoryOnHand: row.inventoryOnHand ? parseInt(row.inventoryOnHand) : undefined,
          })),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success!',
          description: `Created ${data.results.created} sale records${data.results.updated > 0 ? `, updated ${data.results.updated} products` : ''}.`,
        })
        // Reset form
        setRows([
          {
            id: Date.now().toString(),
            productName: '',
            date: new Date().toISOString().split('T')[0],
            unitsSold: '',
            revenue: '',
            inventoryOnHand: '',
          },
        ])
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-bs-text-strong">Add Sales Data</h3>
          <p className="text-sm text-gray-500 mt-1">WhatsApp-style quick entry form</p>
        </div>
        <Button onClick={handleSaveAll} disabled={loading} className="bg-bs-primary hover:bg-bs-primary/90">
          <Save className="h-4 w-4 mr-2" />
          Save All
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="p-4 bg-bs-soft rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Entry #{index + 1}</span>
              {rows.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`product-${row.id}`} className="text-xs">Product Name *</Label>
                <Input
                  id={`product-${row.id}`}
                  list={`products-${row.id}`}
                  value={row.productName}
                  onChange={e => updateRow(row.id, 'productName', e.target.value)}
                  placeholder="Enter product name"
                  className="mt-1"
                />
                <datalist id={`products-${row.id}`}>
                  {productSuggestions.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label htmlFor={`date-${row.id}`} className="text-xs">Date *</Label>
                <Input
                  id={`date-${row.id}`}
                  type="date"
                  value={row.date}
                  onChange={e => updateRow(row.id, 'date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`units-${row.id}`} className="text-xs">Units Sold *</Label>
                <Input
                  id={`units-${row.id}`}
                  type="number"
                  value={row.unitsSold}
                  onChange={e => updateRow(row.id, 'unitsSold', e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`revenue-${row.id}`} className="text-xs">Revenue ($) *</Label>
                <Input
                  id={`revenue-${row.id}`}
                  type="number"
                  step="0.01"
                  value={row.revenue}
                  onChange={e => updateRow(row.id, 'revenue', e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`inventory-${row.id}`} className="text-xs">Inventory On Hand</Label>
                <Input
                  id={`inventory-${row.id}`}
                  type="number"
                  value={row.inventoryOnHand}
                  onChange={e => updateRow(row.id, 'inventoryOnHand', e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={addRow}
        variant="outline"
        className="w-full mt-4 border-dashed border-2 border-bs-accent hover:bg-bs-accent/10"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Row
      </Button>
    </div>
  )
}
