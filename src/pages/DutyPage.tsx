import { useState, useMemo } from 'react'
import {
  ClipboardList,
  User,
  Calendar,
  CheckSquare,
  Square,
  AlertTriangle,
  Plus,
  Trash2,
  Minus,
  Clock,
  Users,
  Cpu,
  Package,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/helpers'
import type { Device, Inventory, DutyRecord, DutyStatus } from '@/types'

export default function DutyPage() {
  const {
    dutyRecords,
    devices,
    inventory,
    currentUser,
    updateDutyRecord,
    addDutyRecord,
    consumeInventory,
  } = useStore()

  const today = formatDate(new Date())

  const todayDuty = useMemo(() => {
    return dutyRecords.find((d) => d.date === today)
  }, [dutyRecords, today])

  const [cleaningTasks, setCleaningTasks] = useState(
    todayDuty?.cleaningTasks || [
      { id: 'task-1', name: '灶台清洁', completed: false },
      { id: 'task-2', name: '地面清扫', completed: false },
      { id: 'task-3', name: '餐具消毒', completed: false },
      { id: 'task-4', name: '油烟机擦拭', completed: false },
      { id: 'task-5', name: '垃圾清运', completed: false },
    ]
  )

  const [reports, setReports] = useState(
    todayDuty?.deviceReports || []
  )

  const [showReportForm, setShowReportForm] = useState(false)
  const [reportDeviceId, setReportDeviceId] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  const [selectedSupplies, setSelectedSupplies] = useState<
    { id: string; name: string; unit: string; quantity: number }[]
  >([])
  const [supplySelectOpen, setSupplySelectOpen] = useState(false)

  const [duration, setDuration] = useState(todayDuty?.usageRecord?.duration || 0)
  const [peopleCount, setPeopleCount] = useState(todayDuty?.usageRecord?.peopleCount || 0)
  const [usedDeviceIds, setUsedDeviceIds] = useState<string[]>(
    todayDuty?.usageRecord?.deviceIds || []
  )

  const availableDevices = devices.filter((d) => d.status !== 'broken')
  const supplyItems = inventory.filter((i) => i.category === 'supplies' && i.quantity > 0)

  const toggleTask = (taskId: string) => {
    setCleaningTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    )
  }

  const toggleDeviceUsage = (deviceId: string) => {
    setUsedDeviceIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    )
  }

  const addReport = () => {
    if (!reportDeviceId || !reportDescription.trim()) return
    const device = devices.find((d) => d.id === reportDeviceId)
    if (!device) return
    const newReport = {
      deviceId: reportDeviceId,
      deviceName: device.name,
      description: reportDescription.trim(),
      reportedAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm'),
    }
    setReports((prev) => [...prev, newReport])
    setReportDeviceId('')
    setReportDescription('')
    setShowReportForm(false)
  }

  const removeReport = (index: number) => {
    setReports((prev) => prev.filter((_, i) => i !== index))
  }

  const addSupply = (item: Inventory) => {
    if (selectedSupplies.find((s) => s.id === item.id)) return
    setSelectedSupplies((prev) => [
      ...prev,
      { id: item.id, name: item.name, unit: item.unit, quantity: 1 },
    ])
    setSupplySelectOpen(false)
  }

  const removeSupply = (id: string) => {
    setSelectedSupplies((prev) => prev.filter((s) => s.id !== id))
  }

  const updateSupplyQuantity = (id: string, delta: number) => {
    setSelectedSupplies((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const item = inventory.find((i) => i.id === id)
        const maxQty = item?.quantity || 999
        const newQty = Math.max(1, Math.min(maxQty, s.quantity + delta))
        return { ...s, quantity: newQty }
      })
    )
  }

  const handleSave = () => {
    const dutyStatus: DutyStatus = cleaningTasks.every((t) => t.completed) ? 'completed' : 'in_progress'
    const dutyData: Omit<DutyRecord, 'id' | 'createdAt'> = {
      date: today,
      userId: currentUser.id,
      userName: currentUser.name,
      status: dutyStatus,
      cleaningTasks,
      deviceReports: reports,
      usageRecord: {
        deviceIds: usedDeviceIds,
        duration,
        peopleCount,
      },
    }

    selectedSupplies.forEach((s) => {
      consumeInventory(s.id, s.quantity)
    })

    if (todayDuty) {
      updateDutyRecord(todayDuty.id, dutyData)
    } else {
      addDutyRecord(dutyData)
    }
  }

  const completedTasksCount = cleaningTasks.filter((t) => t.completed).length
  const dutyStatusLabel = {
    scheduled: { text: '待开始', color: 'bg-gray-100 text-gray-600' },
    in_progress: { text: '进行中', color: 'bg-primary/10 text-primary' },
    completed: { text: '已完成', color: 'bg-secondary/10 text-secondary' },
  }

  return (
    <div className="min-h-screen bg-accent/30">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">值班记录</h1>
            <p className="text-sm text-gray-500">记录今日值班情况、清洁任务和物资消耗</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              当日值班信息
            </h2>
            <span
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium',
                todayDuty
                  ? dutyStatusLabel[todayDuty.status].color
                  : dutyStatusLabel.in_progress.color
              )}
            >
              {todayDuty ? dutyStatusLabel[todayDuty.status].text : '进行中'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">值班人员</p>
                <p className="font-medium text-gray-900">{currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">值班日期</p>
                <p className="font-medium text-gray-900">{today}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              清洁任务检查
            </h2>
            <span className="text-sm text-gray-500">
              已完成 <span className="font-semibold text-secondary">{completedTasksCount}</span>
              <span className="mx-1">/</span>
              {cleaningTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {cleaningTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                  task.completed
                    ? 'bg-secondary/5 border-secondary/20'
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                )}
              >
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-secondary flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'font-medium flex-1',
                    task.completed ? 'text-secondary line-through' : 'text-gray-700'
                  )}
                >
                  {task.name}
                </span>
                {task.completed && (
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              设备异常上报
            </h2>
            <button
              onClick={() => setShowReportForm(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新增上报
            </button>
          </div>

          {reports.length > 0 && (
            <div className="space-y-3 mb-4">
              {reports.map((report, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-warning/5 border border-warning/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="font-medium text-gray-900">{report.deviceName}</span>
                        <span className="text-xs text-gray-400">{report.reportedAt}</span>
                      </div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                    <button
                      onClick={() => removeReport(idx)}
                      className="w-8 h-8 rounded-lg hover:bg-warning/10 flex items-center justify-center text-gray-400 hover:text-warning"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reports.length === 0 && !showReportForm && (
            <div className="text-center py-6 text-gray-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无设备异常上报</p>
            </div>
          )}

          {showReportForm && (
            <div className="p-4 rounded-xl bg-accent/50 border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">新增异常上报</h3>
                <button
                  onClick={() => setShowReportForm(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择设备
                </label>
                <select
                  value={reportDeviceId}
                  onChange={(e) => setReportDeviceId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">请选择设备</option>
                  {devices.map((d: Device) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.location})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题描述
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="请详细描述设备异常情况..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <button
                onClick={addReport}
                disabled={!reportDeviceId || !reportDescription.trim()}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-colors',
                  reportDeviceId && reportDescription.trim()
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                提交上报
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              耗材消耗登记
            </h2>
            <div className="relative">
              <button
                onClick={() => setSupplySelectOpen(!supplySelectOpen)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加耗材
              </button>
              {supplySelectOpen && supplyItems.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                  {supplyItems.map((item: Inventory) => (
                    <button
                      key={item.id}
                      onClick={() => addSupply(item)}
                      disabled={!!selectedSupplies.find((s) => s.id === item.id)}
                      className={cn(
                        'w-full px-4 py-3 text-left text-sm flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-accent/50 transition-colors',
                        selectedSupplies.find((s) => s.id === item.id) &&
                          'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-400">
                        库存 {item.quantity}{item.unit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSupplies.length > 0 ? (
            <div className="space-y-3">
              {selectedSupplies.map((supply) => (
                <div
                  key={supply.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-accent/50 border border-gray-100"
                >
                  <Package className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-medium text-gray-900 flex-1">{supply.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateSupplyQuantity(supply.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-semibold text-gray-900">
                      {supply.quantity}
                    </span>
                    <button
                      onClick={() => updateSupplyQuantity(supply.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-400 w-8">{supply.unit}</span>
                  </div>
                  <button
                    onClick={() => removeSupply(supply.id)}
                    className="w-8 h-8 rounded-lg hover:bg-warning/10 flex items-center justify-center text-gray-400 hover:text-warning"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂未登记耗材消耗</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-primary" />
            使用记录
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                使用时长（分钟）
              </label>
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                使用人数
              </label>
              <input
                type="number"
                min={0}
                value={peopleCount}
                onChange={(e) => setPeopleCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使用设备
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableDevices.map((device: Device) => {
                const isSelected = usedDeviceIds.includes(device.id)
                return (
                  <button
                    key={device.id}
                    onClick={() => toggleDeviceUsage(device.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left text-sm transition-all',
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span className="font-medium truncate">{device.name}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-70 truncate">{device.location}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-4">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl font-semibold text-white bg-primary hover:bg-primary/90 transition-colors shadow-xl shadow-primary/30"
          >
            保存值班记录
          </button>
        </div>
      </div>
    </div>
  )
}
