import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export default function Empty({
  title = '暂无数据',
  description = '这里还没有任何内容',
  icon,
  action,
  className,
}: EmptyProps) {
  return (
    <div className={cn('flex h-full min-h-[300px] flex-col items-center justify-center text-center', className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon ?? <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
