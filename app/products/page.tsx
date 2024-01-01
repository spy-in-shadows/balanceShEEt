'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2 } from 'lucide-react'
import Layout from '@/components/Layout'
import ExportButtons from '@/components/ExportButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [editProduct, setEditProduct] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data, error, mutate } = useSWR('/api/products?active=true', fetcher)

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  if (status === 'loading' || !session) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-bs-primary text-xl">Loading products...</div>
        </div>
      </Layout>
    )
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        })
        mutate()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      })
    }
  }

  const products = data?.products || []

  return (
    <Layout showAlerts>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-bs-text-strong">Products</h1>
            <p className="text-gray-600 mt-1">{products.length} active products</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="products" />
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-bs-primary hover:bg-bs-primary/90 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                </DialogHeader>
                <ProductForm onSuccess={() => { setShowCreateDialog(false); mutate(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Products Grid */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load products</p>
          </div>
        ) : !data ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-500">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products yet. Add your first product to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => {
              const last30DaySales = product.saleRecords
                .slice(0, 30)
                .reduce((sum: number, s: any) => sum + s.unitsSold, 0)
              const last30DayRevenue = product.saleRecords
                .slice(0, 30)
                .reduce((sum: number, s: any) => sum + s.revenue, 0)

              return (
                <div
                  key={product.id}
                  className="rounded-2xl shadow-sm p-6 bg-white border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-bs-text-strong">{product.name}</h3>
                      {product.sku && (
                        <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                      )}
                      {product.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-bs-accent/20 text-bs-primary text-xs rounded-full">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                          </DialogHeader>
                          <ProductForm product={product} onSuccess={() => mutate()} />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {product.name}? This action will soft-delete the product.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Inventory:</span>
                      <span className="font-semibold text-bs-text-strong">{product.inventoryOnHand} units</span>
                    </div>
                    {product.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="font-semibold text-bs-text-strong">${product.price}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last 30d Sales:</span>
                      <span className="font-semibold text-bs-text-strong">{last30DaySales} units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last 30d Revenue:</span>
                      <span className="font-semibold text-bs-text-strong">${last30DayRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

function ProductForm({ product, onSuccess }: { product?: any; onSuccess: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    inventoryOnHand: product?.inventoryOnHand || 0,
    cost: product?.cost || '',
    price: product?.price || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cost: formData.cost ? parseFloat(formData.cost as string) : undefined,
          price: formData.price ? parseFloat(formData.price as string) : undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Product ${product ? 'updated' : 'created'} successfully`,
        })
        onSuccess()
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${product ? 'update' : 'create'} product`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={e => setFormData({ ...formData, sku: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="inventory">Inventory On Hand</Label>
        <Input
          id="inventory"
          type="number"
          value={formData.inventoryOnHand}
          onChange={e => setFormData({ ...formData, inventoryOnHand: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cost">Cost ($)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={e => setFormData({ ...formData, cost: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-bs-primary hover:bg-bs-primary/90">
        {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  )
}
