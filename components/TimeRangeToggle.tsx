'use client'

import { Button } from '@/components/ui/button'

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface TimeRangeToggleProps {
  value: Granularity
  onChange: (value: Granularity) => void
}

export default function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
  const options: { value: Granularity; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {options.map(option => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(option.value)}
          className={`
            ${value === option.value 
              ? 'bg-bs-primary text-white hover:bg-bs-primary/90' 
              : 'hover:bg-gray-100'
            }
          `}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
