import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: number
  color?: 'orange' | 'green' | 'red' | 'blue' | 'purple'
}

const colorMap = {
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    ring: 'ring-primary/20',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    ring: 'ring-green-200',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    ring: 'ring-red-200',
  },
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    ring: 'ring-blue-200',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    ring: 'ring-purple-200',
  },
}

export default function StatCard({ title, value, icon, trend, color = 'orange' }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className={cn('rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow')}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {trend !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                )}
              >
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl ring-2',
            colors.iconBg,
            colors.iconColor,
            colors.ring
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
