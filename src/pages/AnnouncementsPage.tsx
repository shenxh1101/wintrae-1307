import { useState, useMemo } from 'react'
import {
  CalendarDays,
  Users,
  CheckCircle2,
  BarChart3,
  Pin,
  AlertTriangle,
  Info,
  Bell,
  TrendingUp,
  Package,
  Plus,
  X,
  Megaphone,
  AlertOctagon,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { AnnouncementType } from '@/types'

const typeConfig: Record<AnnouncementType, { label: string; className: string; icon: typeof Info }> = {
  info: { label: '通知', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
  warning: { label: '提醒', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  violation: { label: '违规', className: 'bg-red-100 text-red-700 border-red-200', icon: AlertOctagon },
  stats: { label: '统计', className: 'bg-green-100 text-green-700 border-green-200', icon: TrendingUp },
}

export default function AnnouncementsPage() {
  const {
    announcements,
    getWeeklyStats,
    getConflictBookings,
    getLowStockInventory,
    timeSlots,
    addAnnouncement,
    toggleAnnouncementPin,
    currentUser,
  } = useStore()

  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<AnnouncementType>('info')
  const [newPinned, setNewPinned] = useState(false)

  const weeklyStats = useMemo(() => getWeeklyStats(), [getWeeklyStats])
  const conflictBookings = useMemo(() => getConflictBookings(), [getConflictBookings])
  const lowStockItems = useMemo(() => getLowStockInventory(), [getLowStockInventory])

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [announcements])

  const isAdmin = currentUser.role === 'admin'

  const handleSubmit = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    addAnnouncement({
      title: newTitle.trim(),
      content: newContent.trim(),
      type: newType,
      isPinned: newPinned,
      createdBy: currentUser.name,
    })
    setNewTitle('')
    setNewContent('')
    setNewType('info')
    setNewPinned(false)
    setShowModal(false)
  }

  const statsCards = [
    {
      label: '预约次数',
      value: weeklyStats.totalBookings,
      icon: CalendarDays,
      bg: 'bg-orange-50 border-orange-100',
      iconBg: 'bg-orange-500',
      valueColor: 'text-orange-600',
    },
    {
      label: '使用人数',
      value: weeklyStats.totalPeople,
      icon: Users,
      bg: 'bg-sky-50 border-sky-100',
      iconBg: 'bg-sky-500',
      valueColor: 'text-sky-600',
    },
    {
      label: '完成预约',
      value: weeklyStats.completedBookings,
      icon: CheckCircle2,
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-500',
      valueColor: 'text-emerald-600',
    },
    {
      label: '平均人数',
      value: weeklyStats.avgPeoplePerBooking,
      icon: BarChart3,
      bg: 'bg-violet-50 border-violet-100',
      iconBg: 'bg-violet-500',
      valueColor: 'text-violet-600',
    },
  ]

  const getTimeSlotLabel = (slotId: string) => {
    const slot = timeSlots.find((s) => s.id === slotId)
    return slot ? slot.label : slotId
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">公告中心</h1>
            <p className="mt-1 text-sm text-stone-500">查看通知、使用统计和重要提醒</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              发布公告
            </button>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                'flex items-center gap-4 rounded-xl border p-5',
                card.bg
              )}
            >
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm', card.iconBg)}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-stone-500">{card.label}</p>
                <p className={cn('text-2xl font-bold', card.valueColor)}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-stone-800">公告列表</h2>
                </div>
                <span className="text-xs text-stone-400">共 {announcements.length} 条</span>
              </div>
              <div className="divide-y divide-stone-100">
                {sortedAnnouncements.length === 0 ? (
                  <div className="py-16 text-center text-stone-400">暂无公告</div>
                ) : (
                  sortedAnnouncements.map((ann) => {
                    const TypeIcon = typeConfig[ann.type].icon
                    const isViolation = ann.type === 'violation'
                    return (
                      <div
                        key={ann.id}
                        className={cn(
                          'px-5 py-4 transition hover:bg-stone-50',
                          ann.isPinned && 'bg-amber-50/50',
                          isViolation && 'bg-red-50/40'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {ann.isPinned && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                  <Pin className="h-3 w-3" />
                                  置顶
                                </span>
                              )}
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
                                  typeConfig[ann.type].className
                                )}
                              >
                                <TypeIcon className="h-3 w-3" />
                                {typeConfig[ann.type].label}
                              </span>
                              <h3 className="font-medium text-stone-800">{ann.title}</h3>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-stone-600">{ann.content}</p>
                            <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
                              <span>{ann.createdAt}</span>
                              <span>发布人：{ann.createdBy}</span>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => toggleAnnouncementPin(ann.id)}
                              className={cn(
                                'flex-shrink-0 rounded-lg p-2 transition',
                                ann.isPinned
                                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                  : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                              )}
                              title={ann.isPinned ? '取消置顶' : '置顶'}
                            >
                              <Pin className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-stone-800">预约冲突汇总</h2>
              </div>
              <div className="p-4">
                {conflictBookings.length === 0 ? (
                  <div className="py-8 text-center text-sm text-stone-400">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                    当前无预约冲突
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conflictBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-stone-700">{booking.userName}</span>
                          <span className="rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-800">
                            {booking.activityName}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-stone-500">
                          <p>日期：{booking.date}</p>
                          <p>时段：{getTimeSlotLabel(booking.timeSlotId)}</p>
                          <p>人数：{booking.peopleCount}人</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-4">
                <Package className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-stone-800">待补物资提醒</h2>
              </div>
              <div className="p-4">
                {lowStockItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-stone-400">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                    物资库存充足
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg p-3',
                          item.status === 'out'
                            ? 'border border-red-200 bg-red-50'
                            : 'border border-amber-200 bg-amber-50'
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium text-stone-700">{item.name}</p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            安全库存：{item.safetyStock} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-lg font-bold',
                              item.status === 'out' ? 'text-red-600' : 'text-amber-600'
                            )}
                          >
                            {item.quantity}
                          </p>
                          <p className="text-xs text-stone-500">{item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-800">发布新公告</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">公告标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="请输入公告标题"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">公告内容</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="请输入公告内容"
                  rows={5}
                  className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">公告类型</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AnnouncementType)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="info">通知</option>
                    <option value="warning">提醒</option>
                    <option value="violation">违规</option>
                    <option value="stats">统计</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newPinned}
                      onChange={(e) => setNewPinned(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-stone-700">置顶公告</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
