import { useState } from 'react'
import {
  Package,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Minus,
  X,
  ChefHat,
  Apple,
  Sparkles,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { Inventory, InventoryCategory, InventoryStatus } from '@/types'

const categoryLabels: Record<InventoryCategory, { label: string; icon: typeof ChefHat }> = {
  cookware: { label: '厨具', icon: ChefHat },
  ingredient: { label: '食材', icon: Apple },
  supplies: { label: '耗材', icon: Sparkles },
}

const statusConfig: Record<InventoryStatus, { label: string; className: string; barColor: string; Icon: typeof CheckCircle2 }> = {
  normal: {
    label: '正常',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
    barColor: 'bg-secondary',
    Icon: CheckCircle2,
  },
  low: {
    label: '偏低',
    className: 'bg-warning/10 text-warning border-warning/20',
    barColor: 'bg-warning',
    Icon: AlertCircle,
  },
  out: {
    label: '缺货',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    barColor: 'bg-red-500',
    Icon: AlertTriangle,
  },
}

export default function InventoryPage() {
  const { inventory, consumeInventory, getLowStockInventory } = useStore()
  const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'all'>('all')
  const [consumeModalOpen, setConsumeModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)
  const [consumeAmount, setConsumeAmount] = useState(1)
  const [consumeNote, setConsumeNote] = useState('')

  const lowStockItems = getLowStockInventory()

  const filteredInventory = activeCategory === 'all'
    ? inventory
    : inventory.filter((item) => item.category === activeCategory)

  const openConsumeModal = (item: Inventory) => {
    setSelectedItem(item)
    setConsumeAmount(1)
    setConsumeNote('')
    setConsumeModalOpen(true)
  }

  const handleConsume = () => {
    if (!selectedItem || consumeAmount <= 0) return
    consumeInventory(selectedItem.id, consumeAmount)
    setConsumeModalOpen(false)
    setSelectedItem(null)
  }

  const getProgressPercent = (item: Inventory) => {
    const max = Math.max(item.safetyStock * 2, item.quantity)
    if (max === 0) return 0
    return Math.min(100, Math.round((item.quantity / max) * 100))
  }

  return (
    <div className="min-h-screen bg-accent/30">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">物资清单</h1>
            <p className="text-sm text-gray-500">管理厨房物资库存，及时补充消耗品</p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="font-semibold text-warning">待补物资汇总</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded-full">
                {lowStockItems.length} 项
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border',
                    item.status === 'out'
                      ? 'bg-red-500/5 border-red-500/20 text-red-500'
                      : 'bg-warning/5 border-warning/20 text-warning'
                  )}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-1 text-xs opacity-75">
                    {item.quantity}/{item.safetyStock}{item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all',
              activeCategory === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            )}
          >
            全部 ({inventory.length})
          </button>
          {(Object.keys(categoryLabels) as InventoryCategory[]).map((cat) => {
            const { label, icon: Icon } = categoryLabels[cat]
            const count = inventory.filter((i) => i.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-1.5',
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {label} ({count})
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => {
            const status = statusConfig[item.status]
            const { Icon: StatusIcon } = status
            const progress = getProgressPercent(item)
            const { icon: CatIcon } = categoryLabels[item.category]

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                      <CatIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1',
                      status.className
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-2xl font-bold text-gray-900">
                      {item.quantity}
                      <span className="text-sm font-normal text-gray-400 ml-1">{item.unit}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      安全库存 {item.safetyStock}{item.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', status.barColor)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    更新于 {item.lastUpdated}
                  </span>
                  <button
                    onClick={() => openConsumeModal(item)}
                    disabled={item.quantity === 0}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all',
                      item.quantity === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    )}
                  >
                    <Minus className="w-4 h-4" />
                    消耗登记
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {consumeModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">消耗登记</h2>
              <button
                onClick={() => setConsumeModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="p-4 rounded-xl bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                    {(() => {
                      const { icon: CatIcon } = categoryLabels[selectedItem.category]
                      return <CatIcon className="w-6 h-6 text-primary" />
                    })()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedItem.name}</p>
                    <p className="text-sm text-gray-500">
                      当前库存：{selectedItem.quantity} {selectedItem.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  消耗数量
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConsumeAmount(Math.max(1, consumeAmount - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={selectedItem.quantity}
                    value={consumeAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setConsumeAmount(Math.max(1, Math.min(selectedItem.quantity, val)))
                    }}
                    className="flex-1 h-10 text-center text-lg font-semibold rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    onClick={() => setConsumeAmount(Math.min(selectedItem.quantity, consumeAmount + 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                  >
                    +
                  </button>
                  <span className="text-gray-500 text-sm w-10">{selectedItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={consumeNote}
                  onChange={(e) => setConsumeNote(e.target.value)}
                  placeholder="记录使用场景等信息..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setConsumeModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConsume}
                className="flex-1 py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                确认消耗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
