import { useState } from 'react'
import {
  Settings,
  Clock,
  Cpu,
  Users,
  Sparkles,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Wrench,
  XCircle,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { DeviceStatus } from '@/types'

const deviceStatusConfig: Record<DeviceStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  available: {
    label: '可用',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
    Icon: CheckCircle2,
  },
  in_use: {
    label: '使用中',
    className: 'bg-primary/10 text-primary border-primary/20',
    Icon: Clock,
  },
  maintenance: {
    label: '维护中',
    className: 'bg-warning/10 text-warning border-warning/20',
    Icon: Wrench,
  },
  broken: {
    label: '故障',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    Icon: XCircle,
  },
}

const statusOptions: DeviceStatus[] = ['available', 'maintenance', 'broken']

export default function SettingsPage() {
  const {
    timeSlots,
    devices,
    settings,
    toggleTimeSlotEnabled,
    updateTimeSlot,
    updateDeviceStatus,
    updateSettings,
  } = useStore()

  const [maxPeople, setMaxPeople] = useState(settings.maxPeoplePerBooking)
  const [advanceDays, setAdvanceDays] = useState(settings.bookingAdvanceDays)
  const [cleaningRequired, setCleaningRequired] = useState(settings.cleaningRequired)

  const handleMaxPeopleChange = (value: number) => {
    const clamped = Math.max(1, Math.min(100, value))
    setMaxPeople(clamped)
    updateSettings({ maxPeoplePerBooking: clamped })
  }

  const handleAdvanceDaysChange = (value: number) => {
    const clamped = Math.max(1, Math.min(30, value))
    setAdvanceDays(clamped)
    updateSettings({ bookingAdvanceDays: clamped })
  }

  const handleCleaningToggle = () => {
    const newValue = !cleaningRequired
    setCleaningRequired(newValue)
    updateSettings({ cleaningRequired: newValue })
  }

  const handleCapacityChange = (slotId: string, value: number) => {
    const clamped = Math.max(1, Math.min(100, value))
    updateTimeSlot(slotId, { maxCapacity: clamped })
  }

  return (
    <div className="min-h-screen bg-accent/30">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
            <p className="text-sm text-gray-500">管理厨房预约、设备和规则配置</p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">时段设置</h2>
                <p className="text-sm text-gray-500">管理可预约时段及容量限制</p>
              </div>
            </div>

            <div className="space-y-3">
              {timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border transition-all',
                    slot.enabled
                      ? 'bg-gray-50/50 border-gray-100'
                      : 'bg-gray-100/50 border-gray-200 opacity-70'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTimeSlotEnabled(slot.id)}
                      className={cn(
                        'relative w-12 h-7 rounded-full transition-colors',
                        slot.enabled ? 'bg-primary' : 'bg-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all',
                          slot.enabled ? 'left-6' : 'left-1'
                        )}
                      />
                    </button>
                    <div>
                      <div className="font-medium text-gray-900">{slot.label}</div>
                      <div className="text-sm text-gray-500">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">人数上限</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCapacityChange(slot.id, slot.maxCapacity - 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="w-14 text-center font-semibold text-gray-900">
                        {slot.maxCapacity}
                      </div>
                      <button
                        onClick={() => handleCapacityChange(slot.id, slot.maxCapacity + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-400">人</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">设备管理</h2>
                <p className="text-sm text-gray-500">查看和管理厨房设备状态</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {devices.map((device) => {
                const status = deviceStatusConfig[device.status]
                const { Icon: StatusIcon } = status
                return (
                  <div
                    key={device.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{device.location}</p>
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

                    {device.description && (
                      <p className="text-sm text-gray-500 mb-3">{device.description}</p>
                    )}

                    <div className="flex gap-2">
                      {statusOptions.map((s) => {
                        const config = deviceStatusConfig[s]
                        const isActive = device.status === s
                        return (
                          <button
                            key={s}
                            onClick={() => updateDeviceStatus(device.id, s)}
                            className={cn(
                              'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                              isActive
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30 hover:text-primary'
                            )}
                          >
                            <config.Icon className="w-3 h-3" />
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">预约规则</h2>
                <p className="text-sm text-gray-500">设置预约人数和时间限制</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">最多预约人数</div>
                  <div className="text-sm text-gray-500 mt-0.5">单次预约最多可预约的人数</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMaxPeopleChange(maxPeople - 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold"
                  >
                    -
                  </button>
                  <div className="w-16 text-center text-xl font-bold text-gray-900">
                    {maxPeople}
                  </div>
                  <button
                    onClick={() => handleMaxPeopleChange(maxPeople + 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400 w-8">人</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                <div>
                  <div className="font-medium text-gray-900">可预约天数</div>
                  <div className="text-sm text-gray-500 mt-0.5">可提前预约的最大天数</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdvanceDaysChange(advanceDays - 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold"
                  >
                    -
                  </button>
                  <div className="w-16 text-center text-xl font-bold text-gray-900">
                    {advanceDays}
                  </div>
                  <button
                    onClick={() => handleAdvanceDaysChange(advanceDays + 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400 w-8">天</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">清洁要求</h2>
                <p className="text-sm text-gray-500">厨房使用后的清洁规定</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100">
              <div>
                <div className="font-medium text-gray-900">使用后必须清洁</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  开启后，预约完成后需确认清洁任务
                </div>
              </div>
              <button
                onClick={handleCleaningToggle}
                className={cn(
                  'relative w-14 h-8 rounded-full transition-colors',
                  cleaningRequired ? 'bg-primary' : 'bg-gray-300'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all',
                    cleaningRequired ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
