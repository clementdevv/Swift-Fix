
// components/Sidebar.tsx
'use client'

import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  Calendar,
  HelpCircle,
  Power,
  User
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import LogoutModal from './logout-modal'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Service Orders', href: '/orders', icon: FileText },
  { name: 'Repairs', href: '/repairs', icon: Wrench },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
]

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40
        w-64 h-screen bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Briqoly
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Service Provider Platform</p>
          </div>
          
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="flex flex-col">
            <div className="p-4 space-y-1">
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-muted w-full transition-colors">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Help & Support</span>
              </button>
              <Link
                href="/settings"
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${pathname === '/settings' 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-foreground hover:bg-muted'
                  }
                `}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </div>
            <div className="p-4 border-t border-border space-y-1">
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <Power className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  )
}