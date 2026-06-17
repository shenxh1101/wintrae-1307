import { useState, useMemo, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  UtensilsCrossed,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Flame,
  Cookie,
  Waves,
  Zap,
  PackageOpen,
  Upload,
  Check,
  X,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { formatDate } from '@/utils/helpers'
import { cn } from '@/lib/utils'
import type { DeviceType } from '@/types'

const steps = [
  { id: 1, title: '基本信息', icon: FileText },
  { id: 2, title: '日期时段', icon: CalendarDays },
  { id: 3, title: '选择设备', icon: UtensilsCrossed },
  { id: 4, title: '登记人数', icon: Users },
  { id: 5, title: '菜单信息', icon: ChefHat },
  { id: 6, title: '确认提交', icon: CheckCircle2 },
]

const deviceTypeIcons: Record<DeviceType, typeof Flame> = {
  stove: Flame,
  oven: Cookie,
  steamer: Waves,
  microwave: Zap,
  fryer: PackageOpen,
  other: UtensilsCrossed,
}

const deviceTypeLabels: Record<DeviceType, string> = {
  stove: '灶台',
  oven: '烤箱',
  steamer: '蒸箱',
  microwave: '微波炉',
  fryer: '空气炸锅',
  other: '其他',
}

interface BookingFormData {
  activityName: string
  purpose: string
  date: string
  timeSlotId: string
  deviceIds: string[]
  peopleCount: number
  menu: string
  menuImage: string
  menuImageName: string
}

const initialFormData: BookingFormData = {
  activityName: '',
  purpose: '',
  date: formatDate(new Date()),
  timeSlotId: '',
  deviceIds: [],
  peopleCount: 1,
  menu: '',
  menuImage: '',
  menuImageName: '',
}

export default function BookingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>(initialFormData)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    timeSlots,
    devices,
    bookings,
    currentUser,
    settings,
    addBooking,
    getBookingsByDate,
    getSlotAvailability,
  } = useStore()

  const updateField = <K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleDevice = (deviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      deviceIds: prev.deviceIds.includes(deviceId)
        ? prev.deviceIds.filter((id) => id !== deviceId)
        : [...prev.deviceIds, deviceId],
    }))
  }

  const selectedSlotAvailability = useMemo(() => {
    if (!formData.date || !formData.timeSlotId) {
      return { remainingCapacity: 0, isFull: false, totalCapacity: 0, usedCapacity: 0 }
    }
    return getSlotAvailability(formData.date, formData.timeSlotId)
  }, [formData.date, formData.timeSlotId, getSlotAvailability])

  const exceedsCapacity = useMemo(() => {
    if (!formData.timeSlotId) return false
    return formData.peopleCount > selectedSlotAvailability.remainingCapacity
  }, [formData.peopleCount, formData.timeSlotId, selectedSlotAvailability.remainingCapacity])

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.activityName.trim().length > 0 && formData.purpose.trim().length > 0
      case 2:
        return formData.date && formData.timeSlotId
      case 3:
        return formData.deviceIds.length > 0
      case 4:
        return (
          formData.peopleCount >= 1 &&
          formData.peopleCount <= settings.maxPeoplePerBooking &&
          !exceedsCapacity
        )
      case 5:
        return true
      default:
        return true
    }
  }, [currentStep, formData, settings.maxPeoplePerBooking, exceedsCapacity])

  const selectedDateBookings = useMemo(() => {
    return getBookingsByDate(formData.date).filter(
      (b) => b.status !== 'cancelled'
    )
  }, [formData.date, getBookingsByDate])

  const slotHasConflict = (slotId: string) => {
    const slotBookings = selectedDateBookings.filter((b) => b.timeSlotId === slotId)
    const slot = timeSlots.find((s) => s.id === slotId)
    if (!slot) return false
    const totalPeople = slotBookings.reduce((sum, b) => sum + b.peopleCount, 0)
    return totalPeople >= slot.maxCapacity
  }

  const getSlotPeopleCount = (slotId: string) => {
    return selectedDateBookings
      .filter((b) => b.timeSlotId === slotId)
      .reduce((sum, b) => sum + b.peopleCount, 0)
  }

  const handleNext = () => {
    if (currentStep < steps.length && canProceed) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      updateField('menuImage', result)
      updateField('menuImageName', file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    updateField('menuImage', '')
    updateField('menuImageName', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (exceedsCapacity) return
    addBooking({
      userId: currentUser.id,
      userName: currentUser.name,
      date: formData.date,
      timeSlotId: formData.timeSlotId,
      deviceIds: formData.deviceIds,
      purpose: formData.purpose,
      activityName: formData.activityName,
      peopleCount: formData.peopleCount,
      menu: formData.menu || undefined,
      menuImage: formData.menuImage || undefined,
      menuImageName: formData.menuImageName || undefined,
    })
    setShowSuccess(true)
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setCurrentStep(1)
    setShowSuccess(false)
  }

  if (showSuccess) {
    const selectedSlot = timeSlots.find((s) => s.id === formData.timeSlotId)
    const selectedDevices = devices.filter((d) => formData.deviceIds.includes(d.id))

    return (
      <div className="min-h-screen bg-[#FFF8F0] p-6 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">预约申请提交成功</h2>
          <p className="text-gray-600 mb-6">您的预约已提交，请等待管理员审核确认</p>

          <div className="text-left rounded-xl bg-gray-50 p-5 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">活动名称</span>
              <span className="font-medium text-gray-900">{formData.activityName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预约日期</span>
              <span className="font-medium text-gray-900">{formData.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预约时段</span>
              <span className="font-medium text-gray-900">
                {selectedSlot ? `${selectedSlot.label} (${selectedSlot.startTime}-${selectedSlot.endTime})` : '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">使用设备</span>
              <span className="font-medium text-gray-900">
                {selectedDevices.map((d) => d.name).join('、') || '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">参与人数</span>
              <span className="font-medium text-gray-900">{formData.peopleCount}人</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">申请人</span>
              <span className="font-medium text-gray-900">{currentUser.name}</span>
            </div>
            {formData.menuImage && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">菜单图片</p>
                <img
                  src={formData.menuImage}
                  alt={formData.menuImageName || '菜单图片'}
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              继续预约
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
            >
              查看日历
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && 'bg-orange-600 border-orange-600 text-white',
                    isActive && 'bg-orange-50 border-orange-600 text-orange-600',
                    !isActive && !isCompleted && 'bg-white border-gray-200 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isActive ? 'text-orange-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded',
                    isCompleted ? 'bg-orange-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          活动名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.activityName}
          onChange={(e) => updateField('activityName', e.target.value)}
          placeholder="例如：周末家庭聚餐、烘焙兴趣班等"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          使用用途 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.purpose}
          onChange={(e) => updateField('purpose', e.target.value)}
          placeholder="请简要描述本次使用厨房的目的..."
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
        />
      </div>

      <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-700">
        <p className="font-medium mb-1">提示</p>
        <p className="text-orange-600">
          请准确填写活动信息，管理员将根据内容进行审核。活动名称需简洁明了。
        </p>
      </div>
    </div>
  )

  const renderStep2 = () => {
    const today = new Date()
    const maxDate = new Date()
    maxDate.setDate(today.getDate() + settings.bookingAdvanceDays)

    const enabledSlots = timeSlots.filter((slot) => slot.enabled)

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            选择日期 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={formData.date}
              min={formatDate(today)}
              max={formatDate(maxDate)}
              onChange={(e) => updateField('date', e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            可预约范围：今天起 {settings.bookingAdvanceDays} 天内
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            选择时段 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {enabledSlots.map((slot) => {
              const availability = getSlotAvailability(formData.date, slot.id)
              const isFull = availability.isFull
              const isSelected = formData.timeSlotId === slot.id
              const disabled = isFull
              const remaining = availability.remainingCapacity

              return (
                <button
                  key={slot.id}
                  onClick={() => !disabled && updateField('timeSlotId', slot.id)}
                  disabled={disabled}
                  className={cn(
                    'relative rounded-lg border p-4 text-left transition-all',
                    isSelected &&
                      'border-orange-500 bg-orange-50 ring-2 ring-orange-200',
                    !isSelected && !disabled &&
                      'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30',
                    disabled && 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={cn(
                        'font-medium',
                        disabled ? 'text-gray-400' : isSelected ? 'text-orange-700' : 'text-gray-900'
                      )}>
                        {slot.label}
                      </p>
                      <p className={cn(
                        'text-sm mt-0.5',
                        disabled ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-orange-600" />
                    )}
                    {disabled && (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="mt-3">
                    <div className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      isFull
                        ? 'bg-red-100 text-red-700'
                        : remaining <= 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    )}>
                      <Users className="h-3 w-3" />
                      {isFull ? '已满员' : `剩余 ${remaining} 名额`}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      共 {slot.maxCapacity} 人
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {formData.date && formData.timeSlotId && selectedDateBookings.some(
          (b) => b.timeSlotId === formData.timeSlotId
        ) && (
          <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600 flex-shrink-0" />
            <div className="text-yellow-700">
              <p className="font-medium">该时段已有预约</p>
              <p className="text-yellow-600 mt-0.5">
                当前时段已有 {selectedDateBookings.filter((b) => b.timeSlotId === formData.timeSlotId).length} 个预约，
                请确认人数总和不超过上限。
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStep3 = () => {
    const availableDevices = devices.filter((d) => d.status === 'available')
    const groupedByType = availableDevices.reduce((acc, device) => {
      if (!acc[device.type]) acc[device.type] = []
      acc[device.type].push(device)
      return acc
    }, {} as Record<DeviceType, typeof devices>)

    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">选择设备</p>
          <p className="text-blue-600">
            请选择本次预约需要使用的厨房设备，可多选。仅显示当前可用的设备。
          </p>
        </div>

        <div className="space-y-5">
          {(Object.keys(groupedByType) as DeviceType[]).map((type) => {
            const Icon = deviceTypeIcons[type]
            return (
              <div key={type}>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Icon className="h-4 w-4 text-gray-500" />
                  {deviceTypeLabels[type]}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedByType[type].map((device) => {
                    const isSelected = formData.deviceIds.includes(device.id)
                    return (
                      <button
                        key={device.id}
                        onClick={() => toggleDevice(device.id)}
                        className={cn(
                          'relative rounded-lg border p-4 text-left transition-all',
                          isSelected &&
                            'border-orange-500 bg-orange-50 ring-2 ring-orange-200',
                          !isSelected &&
                            'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className={cn(
                              'font-medium truncate',
                              isSelected ? 'text-orange-700' : 'text-gray-900'
                            )}>
                              {device.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {device.location}
                            </p>
                            {device.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {device.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={cn(
                              'h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-2',
                              isSelected && 'bg-orange-600 border-orange-600',
                              !isSelected && 'border-gray-300'
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {devices.filter((d) => d.status !== 'available').length > 0 && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">暂不可用的设备</p>
            <div className="flex flex-wrap gap-2">
              {devices
                .filter((d) => d.status !== 'available')
                .map((device) => (
                  <span
                    key={device.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs',
                      device.status === 'in_use' && 'bg-blue-100 text-blue-700',
                      device.status === 'maintenance' && 'bg-yellow-100 text-yellow-700',
                      device.status === 'broken' && 'bg-red-100 text-red-700'
                    )}
                  >
                    {device.name}
                    <span className="text-[10px] opacity-75">
                      ({device.status === 'in_use' && '使用中'}
                      {device.status === 'maintenance' && '维护中'}
                      {device.status === 'broken' && '故障'})
                    </span>
                  </span>
                ))}
            </div>
          </div>
        )}

        {formData.deviceIds.length > 0 && (
          <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
            已选择 {formData.deviceIds.length} 个设备
          </div>
        )}
      </div>
    )
  }

  const renderStep4 = () => (
    <div className="space-y-6">
      {formData.timeSlotId && (
        <div className={cn(
          'rounded-lg p-4 text-sm',
          exceedsCapacity
            ? 'bg-red-50 border border-red-200'
            : 'bg-green-50 border border-green-200'
        )}>
          <div className="flex items-center gap-2">
            <Users className={cn('h-4 w-4', exceedsCapacity ? 'text-red-600' : 'text-green-600')} />
            <span className={cn('font-medium', exceedsCapacity ? 'text-red-700' : 'text-green-700')}>
              时段剩余名额：{selectedSlotAvailability.remainingCapacity} 人
            </span>
          </div>
          <p className={cn('mt-1 text-xs', exceedsCapacity ? 'text-red-600' : 'text-green-600')}>
            当前已预约 {selectedSlotAvailability.usedCapacity} 人，总容量 {selectedSlotAvailability.totalCapacity} 人
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          参与人数 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => updateField('peopleCount', Math.max(1, formData.peopleCount - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center">
            <span className={cn(
              'text-3xl font-bold',
              exceedsCapacity ? 'text-red-600' : 'text-gray-900'
            )}>
              {formData.peopleCount}
            </span>
            <span className="text-gray-500 ml-1">人</span>
          </div>
          <button
            onClick={() =>
              updateField(
                'peopleCount',
                Math.min(settings.maxPeoplePerBooking, formData.peopleCount + 1)
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3">
          <input
            type="range"
            min={1}
            max={settings.maxPeoplePerBooking}
            value={formData.peopleCount}
            onChange={(e) => updateField('peopleCount', Number(e.target.value))}
            className={cn(
              'w-full h-2 rounded-lg appearance-none cursor-pointer',
              exceedsCapacity ? 'accent-red-600' : 'accent-orange-600'
            )}
            style={{ backgroundColor: exceedsCapacity ? '#fecaca' : '#e5e7eb' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1人</span>
            <span>最多 {settings.maxPeoplePerBooking} 人</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 4, 8, 12, 16, 20].filter((n) => n <= settings.maxPeoplePerBooking).map((num) => {
          const exceeds = formData.timeSlotId && num > selectedSlotAvailability.remainingCapacity
          return (
            <button
              key={num}
              onClick={() => updateField('peopleCount', num)}
              className={cn(
                'rounded-lg border py-2.5 text-sm font-medium transition-colors',
                formData.peopleCount === num
                  ? exceeds
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {num}人
            </button>
          )
        })}
      </div>

      {exceedsCapacity && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="text-red-700">
            <p className="font-medium">人数超出限制</p>
            <p className="text-red-600 mt-1">
              当前登记人数超过该时段剩余名额，请减少人数或选择其他时段。
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-700">
        <p className="font-medium mb-1">人数限制</p>
        <p className="text-orange-600">
          每次预约最多允许 {settings.maxPeoplePerBooking} 人同时使用厨房，如需更多人数请分时段预约或联系管理员。
        </p>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-gray-500" />
          菜单内容
        </label>
        <textarea
          value={formData.menu}
          onChange={(e) => updateField('menu', e.target.value)}
          placeholder="请填写本次准备制作的菜品，例如：&#10;红烧肉、清蒸鲈鱼、蒜蓉西兰花、番茄蛋汤"
          rows={6}
          className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
        />
        <p className="mt-1 text-xs text-gray-500">
          填写菜单有助于管理员了解物资消耗情况，选填但建议填写
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4 text-gray-500" />
          上传菜单图片（可选）
        </label>
        {formData.menuImage ? (
          <div className="relative rounded-lg border border-gray-200 overflow-hidden">
            <img
              src={formData.menuImage}
              alt={formData.menuImageName || '菜单图片'}
              className="w-full h-48 object-contain bg-gray-50"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-3 bg-white border-t border-gray-100">
              <p className="text-sm text-gray-700 truncate">
                <FileText className="inline h-4 w-4 mr-1.5 text-gray-400" />
                {formData.menuImageName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-orange-50/50 hover:border-orange-300 transition-colors">
              <div className="flex flex-col items-center justify-center pt-4 pb-5">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-orange-600">点击上传</span> 或拖拽文件到此处
                </p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，单张不超过 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">关于菜单</p>
        <p className="text-blue-600">
          提供详细的菜单信息有助于提前准备食材和器具，也方便管理员进行物资规划。
        </p>
      </div>
    </div>
  )

  const renderStep6 = () => {
    const selectedSlot = timeSlots.find((s) => s.id === formData.timeSlotId)
    const selectedDevices = devices.filter((d) => formData.deviceIds.includes(d.id))

    const summaryItems = [
      { label: '活动名称', value: formData.activityName, icon: FileText },
      {
        label: '使用用途',
        value: formData.purpose,
        icon: FileText,
      },
      { label: '预约日期', value: formData.date, icon: CalendarDays },
      {
        label: '预约时段',
        value: selectedSlot
          ? `${selectedSlot.label} (${selectedSlot.startTime}-${selectedSlot.endTime})`
          : '-',
        icon: Clock,
      },
      {
        label: '使用设备',
        value: selectedDevices.map((d) => d.name).join('、') || '-',
        icon: UtensilsCrossed,
      },
      { label: '参与人数', value: `${formData.peopleCount} 人`, icon: Users },
      {
        label: '菜单内容',
        value: formData.menu || '未填写',
        icon: ChefHat,
      },
      { label: '申请人', value: currentUser.name, icon: Users },
    ]

    return (
      <div className="space-y-6">
        {formData.timeSlotId && (
          <div className={cn(
            'rounded-xl border p-4',
            exceedsCapacity
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                exceedsCapacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              )}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className={cn(
                  'font-medium',
                  exceedsCapacity ? 'text-red-700' : 'text-green-700'
                )}>
                  时段剩余名额：{selectedSlotAvailability.remainingCapacity} 人
                </p>
                <p className={cn(
                  'text-xs mt-0.5',
                  exceedsCapacity ? 'text-red-600' : 'text-green-600'
                )}>
                  当前已预约 {selectedSlotAvailability.usedCapacity} 人，总容量 {selectedSlotAvailability.totalCapacity} 人
                </p>
              </div>
            </div>
          </div>
        )}

        {exceedsCapacity && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="text-red-700">
              <p className="font-medium">人数超出限制</p>
              <p className="text-red-600 mt-1">
                当前登记人数超过该时段剩余名额，请返回上一步减少人数或选择其他时段。
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">请确认预约信息</h3>
          <div className="space-y-4">
            {summaryItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap break-words">
                      {item.value}
                    </p>
                  </div>
                </div>
              )
            })}
            {formData.menuImage && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                  <ChefHat className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">菜单图片</p>
                  <img
                    src={formData.menuImage}
                    alt={formData.menuImageName || '菜单图片'}
                    className="mt-1 w-full max-w-xs h-24 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          <p className="font-medium mb-1">温馨提示</p>
          <ul className="text-orange-600 space-y-1 list-disc list-inside">
            <li>提交后预约状态为"待审核"，管理员将尽快审核</li>
            <li>请按时到达厨房使用，如需取消请提前2小时</li>
            <li>使用完毕后请清洁设备和场地，遵守厨房使用规范</li>
          </ul>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      case 6:
        return renderStep6()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-orange-600" />
            厨房预约申请
          </h1>
          <p className="mt-1 text-sm text-gray-600">按步骤填写信息，完成厨房使用预约</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {renderStepIndicator()}

          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                currentStep === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              上一步
            </button>

            <div className="text-sm text-gray-500">
              第 {currentStep} / {steps.length} 步
            </div>

            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
                  canProceed
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={exceedsCapacity}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
                  exceedsCapacity
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                确认提交
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
