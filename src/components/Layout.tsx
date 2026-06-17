import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardList,
  Package,
  ClipboardCheck,
  Megaphone,
  Menu,
  X,
  ChefHat,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/calendar', label: '厨房日历', icon: CalendarDays },
  { to: '/booking', label: '预约申请', icon: ClipboardList },
  { to: '/inventory', label: '物资清单', icon: Package },
  { to: '/duty', label: '值班记录', icon: ClipboardCheck },
  { to: '/announcements', label: '公告', icon: Megaphone },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const handleNavClick = () => {
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-accent">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-primary/20 bg-white px-4 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-gray-900">共享厨房</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-primary/20 bg-white shadow-lg transition-transform duration-200 ease-in-out md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-primary/20 px-6">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-gray-900">共享厨房</span>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-primary')} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-primary/10 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">管理员</span>
              <span className="text-xs text-gray-500">admin@kitchen.com</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:pl-64">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
