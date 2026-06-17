import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  AlertTriangle,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Minus,
  Utensils,
  Image,
  FileText,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { formatDate, getMonthDates, isSameDay } from '@/utils/helpers'
import { cn } from '@/lib/utils'
import type { DeviceType, Booking, BookingStatus } from '@/types'

const deviceTypeLabels: Record<DeviceType, string> = {
  stove: '灶台',
  oven: '烤箱',
  steamer: '蒸箱',
  microwave: '微波炉',
  fryer: '空气炸锅',
  other: '其他',
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

export default function CalendarPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today))
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all')
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set())
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const {
    bookings,
    timeSlots,
    devices,
    getConflictBookings,
    getBookingsByDate,
    getDeviceById,
  } = useStore()

  const enabledTimeSlots = useMemo(() => timeSlots.filter((slot) => slot.enabled), [timeSlots])

  const statusLabels: Record<BookingStatus | 'all', string> = {
    all: '全部',
    pending: '待审核',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
  }

  const monthDates = useMemo(() => getMonthDates(currentYear, currentMonth), [currentYear, currentMonth])

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const leadingEmptyDays = (firstDayOfMonth.getDay() + 6) % 7

  const conflictBookings = useMemo(() => getConflictBookings(), [getConflictBookings])
  const conflictDates = useMemo(
    () => new Set(conflictBookings.map((b) => b.date)),
    [conflictBookings]
  )

  const selectedDateBookings = useMemo(() => {
    let result = getBookingsByDate(selectedDate)
    if (selectedDeviceType !== 'all') {
      result = result.filter((b) =>
        b.deviceIds.some((id) => {
          const device = getDeviceById(id)
          return device?.type === selectedDeviceType
        })
      )
    }
    if (selectedStatus !== 'all') {
      result = result.filter((b) => b.status === selectedStatus)
    }
    return result
  }, [selectedDate, selectedDeviceType, selectedStatus, getBookingsByDate, getDeviceById])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getDateBookings = (dateStr: string): Booking[] => {
    let dayBookings = bookings.filter((b) => b.date === dateStr && b.status !== 'cancelled')
    if (selectedDeviceType !== 'all') {
      dayBookings = dayBookings.filter((b) =>
        b.deviceIds.some((id) => {
          const device = getDeviceById(id)
          return device?.type === selectedDeviceType
        })
      )
    }
    if (selectedStatus !== 'all') {
      dayBookings = dayBookings.filter((b) => b.status === selectedStatus)
    }
    return dayBookings
  }

  const getSlotStatus = (slotId: string, dateStr: string) => {
    const slot = enabledTimeSlots.find((s) => s.id === slotId)
    if (!slot) return { status: 'idle', count: 0, total: 0 } as const

    const dayBookings = getDateBookings(dateStr).filter((b) => b.timeSlotId === slotId)
    const activeBookings = dayBookings.filter((b) => b.status !== 'cancelled')
    const totalPeople = activeBookings.reduce((sum, b) => sum + b.peopleCount, 0)

    if (activeBookings.length === 0) {
      return { status: 'free', count: 0, total: slot.maxCapacity } as const
    }
    if (totalPeople >= slot.maxCapacity) {
      return { status: 'full', count: totalPeople, total: slot.maxCapacity } as const
    }
    return { status: 'booked', count: totalPeople, total: slot.maxCapacity } as const
  }

  const toggleBookingExpand = (bookingId: string) => {
    setExpandedBookings((prev) => {
      const next = new Set(prev)
      if (next.has(bookingId)) {
        next.delete(bookingId)
      } else {
        next.add(bookingId)
      }
      return next
    })
  }

  const hasConflictOnDate = (dateStr: string) => {
    return conflictDates.has(dateStr)
  }

  const renderCalendarGrid = () => {
    const cells: JSX.Element[] = []

    for (let i = 0; i < leadingEmptyDays; i++) {
      cells.push(<div key={`empty-${i}`} className="h-24" />)
    }

    monthDates.forEach((date) => {
      const dateStr = formatDate(date)
      const dayBookings = getDateBookings(dateStr)
      const isToday = isSameDay(date, today)
      const isSelected = dateStr === selectedDate
      const hasConflict = hasConflictOnDate(dateStr)

      const statusCounts = {
        free: 0,
        booked: 0,
        full: 0,
      }
      enabledTimeSlots.forEach((slot) => {
        const slotStatus = getSlotStatus(slot.id, dateStr)
        if (slotStatus.status !== 'idle') {
          statusCounts[slotStatus.status as keyof typeof statusCounts]++
        }
      })

      cells.push(
        <button
          key={dateStr}
          onClick={() => setSelectedDate(dateStr)}
          className={cn(
            'relative h-24 rounded-lg border p-2 text-left transition-all',
            'hover:border-orange-400 hover:shadow-md',
            isSelected && 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200',
            !isSelected && isToday && 'border-orange-300 bg-orange-50/50',
            !isSelected && !isToday && 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-sm font-medium',
                isToday && !isSelected && 'text-orange-600',
                isSelected && 'text-orange-700',
                !isToday && !isSelected && 'text-gray-700'
              )}
            >
              {date.getDate()}
            </span>
            {hasConflict && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="mt-1 flex gap-1">
            {statusCounts.booked > 0 && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 text-[10px] font-medium text-yellow-700">
                <Minus className="mr-0.5 h-2.5 w-2.5" />
                {statusCounts.booked}
              </span>
            )}
            {statusCounts.full > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 text-[10px] font-medium text-red-700">
                <XCircle className="mr-0.5 h-2.5 w-2.5" />
                {statusCounts.full}
              </span>
            )}
          </div>
          {dayBookings.length > 0 && (
            <div className="absolute bottom-1 right-1 text-[10px] text-gray-500">
              {dayBookings.length}个预约
            </div>
          )}
        </button>
      )
    })

    return cells
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-7 w-7 text-orange-600" />
              厨房预约日历
            </h1>
            <p className="mt-1 text-sm text-gray-600">查看每日预约状态，管理厨房使用安排</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDeviceType}
                onChange={(e) => setSelectedDeviceType(e.target.value as DeviceType | 'all')}
                className="bg-transparent text-sm outline-none cursor-pointer"
              >
                <option value="all">全部设备</option>
                {(Object.keys(deviceTypeLabels) as DeviceType[]).map((type) => (
                  <option key={type} value={type}>
                    {deviceTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | 'all')}
                className="bg-transparent text-sm outline-none cursor-pointer"
              >
                {(Object.keys(statusLabels) as (BookingStatus | 'all')[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            {conflictBookings.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{conflictBookings.length}个预约冲突</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentYear}年{currentMonth + 1}月
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentYear(today.getFullYear())
                      setCurrentMonth(today.getMonth())
                      setSelectedDate(formatDate(today))
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    今天
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {renderCalendarGrid()}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                  <span>空闲</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
                  <span>部分预约</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                  <span>已满</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-orange-400" />
                  <span>今天</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span>有冲突</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="h-5 w-5 text-orange-600" />
                {selectedDate} 时段详情
              </h3>

              {hasConflictOnDate(selectedDate) && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="font-medium">存在预约冲突</p>
                    <p className="mt-0.5 text-red-600">该日部分时段存在多个预约同时占用的情况，请及时协调处理。</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {enabledTimeSlots.map((slot) => {
                  const slotStatus = getSlotStatus(slot.id, selectedDate)
                  const slotBookings = selectedDateBookings.filter(
                    (b) => b.timeSlotId === slot.id && b.status !== 'cancelled'
                  )

                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        slotStatus.status === 'free' && 'border-green-200 bg-green-50/50',
                        slotStatus.status === 'booked' && 'border-yellow-200 bg-yellow-50/50',
                        slotStatus.status === 'full' && 'border-red-200 bg-red-50/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{slot.label}</p>
                          <p className="text-sm text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {slotStatus.status === 'free' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              空闲
                            </span>
                          )}
                          {slotStatus.status === 'booked' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              <Minus className="h-3 w-3" />
                              部分预约
                            </span>
                          )}
                          {slotStatus.status === 'full' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              <XCircle className="h-3 w-3" />
                              已满
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {slotStatus.count}/{slotStatus.total} 人
                        </span>
                      </div>

                      {slotBookings.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {slotBookings.map((booking) => {
                            const bookingDevices = booking.deviceIds
                              .map((id) => getDeviceById(id))
                              .filter(Boolean)
                            const hasConflict = conflictBookings.some((b) => b.id === booking.id)
                            const isExpanded = expandedBookings.has(booking.id)
                            const menuItems = booking.menu
                              ? booking.menu.split(/[、,，]/).filter(Boolean)
                              : []

                            return (
                              <div
                                key={booking.id}
                                className={cn(
                                  'rounded-md text-sm overflow-hidden',
                                  hasConflict
                                    ? 'bg-red-100/80 border border-red-200'
                                    : 'bg-white border border-gray-100'
                                )}
                              >
                                <button
                                  onClick={() => toggleBookingExpand(booking.id)}
                                  className="w-full p-2.5 text-left hover:bg-gray-50/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-gray-900 truncate">
                                        {booking.activityName}
                                      </p>
                                      <p className="text-gray-600 text-xs mt-0.5">
                                        {booking.userName} · {booking.peopleCount}人
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {hasConflict && (
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                      )}
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="px-2.5 pb-2.5 space-y-2 border-t border-gray-100 pt-2">
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">用途</p>
                                      <p className="text-sm text-gray-700">{booking.purpose}</p>
                                    </div>

                                    {bookingDevices.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">设备</p>
                                        <div className="flex flex-wrap gap-1">
                                          {bookingDevices.map((device) => (
                                            <span
                                              key={device!.id}
                                              className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700"
                                            >
                                              {device!.name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {menuItems.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                          <Utensils className="h-3 w-3" />
                                          菜品列表
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {menuItems.map((item, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-block rounded bg-orange-100 px-2 py-0.5 text-[10px] text-orange-700"
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {booking.menuImage && (
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                          <Image className="h-3 w-3" />
                                          菜单图片
                                        </p>
                                        <div className="relative inline-block">
                                          <img
                                            src={booking.menuImage}
                                            alt={booking.menuImageName || '菜单图片'}
                                            className="h-20 w-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setPreviewImage(booking.menuImage!)}
                                          />
                                          {booking.menuImageName && (
                                            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                              <FileText className="h-3 w-3" />
                                              {booking.menuImageName}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <span
                                        className={cn(
                                          'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                                          booking.status === 'confirmed' &&
                                            'bg-green-100 text-green-700',
                                          booking.status === 'pending' &&
                                            'bg-blue-100 text-blue-700',
                                          booking.status === 'completed' &&
                                            'bg-gray-100 text-gray-600',
                                          booking.status === 'cancelled' &&
                                            'bg-gray-100 text-gray-400'
                                        )}
                                      >
                                        {booking.status === 'confirmed' && '已确认'}
                                        {booking.status === 'pending' && '待审核'}
                                        {booking.status === 'completed' && '已完成'}
                                        {booking.status === 'cancelled' && '已取消'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedDeviceType !== 'all' && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {deviceTypeLabels[selectedDeviceType]}设备列表
                </h3>
                <div className="space-y-2">
                  {devices
                    .filter((d) => d.type === selectedDeviceType)
                    .map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{device.name}</p>
                          <p className="text-xs text-gray-500">{device.location}</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            device.status === 'available' && 'bg-green-100 text-green-700',
                            device.status === 'in_use' && 'bg-blue-100 text-blue-700',
                            device.status === 'maintenance' && 'bg-yellow-100 text-yellow-700',
                            device.status === 'broken' && 'bg-red-100 text-red-700'
                          )}
                        >
                          {device.status === 'available' && '可用'}
                          {device.status === 'in_use' && '使用中'}
                          {device.status === 'maintenance' && '维护中'}
                          {device.status === 'broken' && '故障'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage}
              alt="菜单图片预览"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 rounded-full bg-white/90 p-2 text-gray-700 hover:bg-white transition-colors shadow-md"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
