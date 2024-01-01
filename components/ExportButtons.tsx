'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ExportButtonsProps {
  type?: 'sales' | 'products'
}

export default function ExportButtons({ type = 'sales' }: ExportButtonsProps) {
  const { toast } = useToast()

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/export?format=${format}&type=${type}`)
      
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${type}-export.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${type}-export.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
        
        toast({
          title: 'Success',
          description: `${type} data exported as ${format.toUpperCase()}`,
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>CSV</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('json')}
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>JSON</span>
      </Button>
    </div>
  )
}
