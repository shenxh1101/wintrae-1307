export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type DeviceStatus = 'available' | 'in_use' | 'maintenance' | 'broken'

export type DeviceType = 'stove' | 'oven' | 'steamer' | 'microwave' | 'fryer' | 'other'

export type InventoryCategory = 'cookware' | 'ingredient' | 'supplies'

export type InventoryStatus = 'normal' | 'low' | 'out'

export type AnnouncementType = 'info' | 'warning' | 'violation' | 'stats'

export type DutyStatus = 'scheduled' | 'in_progress' | 'completed'

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  label: string
  maxCapacity: number
  enabled: boolean
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  location: string
  description?: string
  lastMaintenance?: string
}

export interface Inventory {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  safetyStock: number
  status: InventoryStatus
  lastUpdated: string
  description?: string
}

export interface Booking {
  id: string
  userId: string
  userName: string
  date: string
  timeSlotId: string
  deviceIds: string[]
  purpose: string
  activityName: string
  peopleCount: number
  menu?: string
  menuImage?: string
  menuImageName?: string
  status: BookingStatus
  createdAt: string
  note?: string
}

export interface DutyRecord {
  id: string
  date: string
  userId: string
  userName: string
  status: DutyStatus
  cleaningTasks: {
    id: string
    name: string
    completed: boolean
  }[]
  deviceReports: {
    deviceId: string
    deviceName: string
    description: string
    reportedAt: string
  }[]
  consumedMaterials: {
    inventoryId: string
    name: string
    unit: string
    quantity: number
  }[]
  usageRecord?: {
    deviceIds: string[]
    duration: number
    peopleCount: number
  }
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: AnnouncementType
  isPinned: boolean
  createdAt: string
  createdBy: string
}
