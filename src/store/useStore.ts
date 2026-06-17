import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { generateId, formatDate } from '../utils/helpers'
import type {
  Booking,
  Device,
  Inventory,
  DutyRecord,
  Announcement,
  TimeSlot,
} from '../types'
import {
  mockBookings,
  mockDevices,
  mockInventory,
  mockDutyRecords,
  mockAnnouncements,
  mockTimeSlots,
} from '../data/mockData'

interface Settings {
  maxPeoplePerBooking: number
  bookingAdvanceDays: number
  cleaningRequired: boolean
}

interface AppState {
  bookings: Booking[]
  devices: Device[]
  inventory: Inventory[]
  dutyRecords: DutyRecord[]
  announcements: Announcement[]
  timeSlots: TimeSlot[]
  settings: Settings
  currentUser: { id: string; name: string; role: 'admin' | 'resident' }

  addBooking: (data: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Booking
  updateBooking: (id: string, data: Partial<Booking>) => Booking | null
  deleteBooking: (id: string) => boolean
  getBookingsByDate: (date: string) => Booking[]
  getBookingsByDateRange: (start: string, end: string) => Booking[]

  updateDevice: (id: string, data: Partial<Device>) => Device | null
  getDeviceById: (id: string) => Device | undefined

  updateInventory: (id: string, data: Partial<Inventory>) => Inventory | null
  consumeInventory: (id: string, amount: number) => Inventory | null
  getLowStockInventory: () => Inventory[]

  addDutyRecord: (data: Omit<DutyRecord, 'id' | 'createdAt'>) => DutyRecord
  updateDutyRecord: (id: string, data: Partial<DutyRecord>) => DutyRecord | null

  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => Announcement
  toggleAnnouncementPin: (id: string) => Announcement | null

  updateSettings: (data: Partial<Settings>) => void
  getConflictBookings: () => Booking[]
  getWeeklyStats: () => {
    totalBookings: number
    totalPeople: number
    completedBookings: number
    avgPeoplePerBooking: number
  }
}

const now = () => formatDate(new Date(), 'YYYY-MM-DD HH:mm')

const initialState = {
  bookings: mockBookings,
  devices: mockDevices,
  inventory: mockInventory,
  dutyRecords: mockDutyRecords,
  announcements: mockAnnouncements,
  timeSlots: mockTimeSlots,
  settings: {
    maxPeoplePerBooking: 20,
    bookingAdvanceDays: 7,
    cleaningRequired: true,
  },
  currentUser: { id: 'user-7', name: '孙管理员', role: 'admin' as const },
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addBooking: (data) => {
        const booking: Booking = {
          ...data,
          id: generateId('booking'),
          status: 'pending',
          createdAt: now(),
        }
        set((state) => ({ bookings: [booking, ...state.bookings] }))
        return booking
      },
      updateBooking: (id, data) => {
        let updated: Booking | null = null
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id === id) {
              updated = { ...b, ...data }
              return updated
            }
            return b
          }),
        }))
        return updated
      },
      deleteBooking: (id) => {
        const exists = get().bookings.some((b) => b.id === id)
        if (!exists) return false
        set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) }))
        return true
      },
      getBookingsByDate: (date) => get().bookings.filter((b) => b.date === date),
      getBookingsByDateRange: (start, end) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        return get().bookings.filter((b) => {
          const d = new Date(b.date)
          return d >= startDate && d <= endDate
        })
      },

      updateDevice: (id, data) => {
        let updated: Device | null = null
        set((state) => ({
          devices: state.devices.map((d) => {
            if (d.id === id) {
              updated = { ...d, ...data }
              return updated
            }
            return d
          }),
        }))
        return updated
      },
      getDeviceById: (id) => get().devices.find((d) => d.id === id),

      updateInventory: (id, data) => {
        let updated: Inventory | null = null
        set((state) => ({
          inventory: state.inventory.map((i) => {
            if (i.id === id) {
              const next: Inventory = { ...i, ...data, lastUpdated: formatDate(new Date()) }
              if (next.quantity <= 0) next.status = 'out'
              else if (next.quantity <= next.safetyStock) next.status = 'low'
              else next.status = 'normal'
              updated = next
              return updated
            }
            return i
          }),
        }))
        return updated
      },
      consumeInventory: (id, amount) => {
        const item = get().inventory.find((i) => i.id === id)
        if (!item) return null
        const newQty = Math.max(0, item.quantity - amount)
        return get().updateInventory(id, { quantity: newQty })
      },
      getLowStockInventory: () =>
        get().inventory.filter((i) => i.status === 'low' || i.status === 'out'),

      addDutyRecord: (data) => {
        const record: DutyRecord = {
          ...data,
          id: generateId('duty'),
          createdAt: now(),
        }
        set((state) => ({ dutyRecords: [record, ...state.dutyRecords] }))
        return record
      },
      updateDutyRecord: (id, data) => {
        let updated: DutyRecord | null = null
        set((state) => ({
          dutyRecords: state.dutyRecords.map((d) => {
            if (d.id === id) {
              updated = { ...d, ...data }
              return updated
            }
            return d
          }),
        }))
        return updated
      },

      addAnnouncement: (data) => {
        const ann: Announcement = {
          ...data,
          id: generateId('ann'),
          createdAt: now(),
        }
        set((state) => ({ announcements: [ann, ...state.announcements] }))
        return ann
      },
      toggleAnnouncementPin: (id) => {
        const ann = get().announcements.find((a) => a.id === id)
        if (!ann) return null
        let updated: Announcement | null = null
        set((state) => ({
          announcements: state.announcements.map((a) => {
            if (a.id === id) {
              updated = { ...a, isPinned: !a.isPinned }
              return updated
            }
            return a
          }),
        }))
        return updated
      },

      updateSettings: (data) => {
        set((state) => ({ settings: { ...state.settings, ...data } }))
      },

      getConflictBookings: () => {
        const bookings = get().bookings
        const conflicts: Booking[] = []
        for (let i = 0; i < bookings.length; i++) {
          for (let j = i + 1; j < bookings.length; j++) {
            const a = bookings[i]
            const b = bookings[j]
            if (
              a.date === b.date &&
              a.timeSlotId === b.timeSlotId &&
              a.status !== 'cancelled' &&
              b.status !== 'cancelled'
            ) {
              if (!conflicts.includes(a)) conflicts.push(a)
              if (!conflicts.includes(b)) conflicts.push(b)
            }
          }
        }
        return conflicts
      },

      getWeeklyStats: () => {
        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() + 1)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        const fmt = (d: Date) => formatDate(d)
        const weekBookings = get().getBookingsByDateRange(fmt(weekStart), fmt(weekEnd))
        const totalBookings = weekBookings.length
        const completedBookings = weekBookings.filter((b) => b.status === 'completed').length
        const totalPeople = weekBookings.reduce((sum, b) => sum + b.peopleCount, 0)
        return {
          totalBookings,
          totalPeople,
          completedBookings,
          avgPeoplePerBooking: totalBookings > 0 ? Math.round(totalPeople / totalBookings) : 0,
        }
      },
    }),
    {
      name: 'kitchen-management-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        inventory: state.inventory,
        dutyRecords: state.dutyRecords,
        announcements: state.announcements,
        settings: state.settings,
      }),
    }
  )
)
