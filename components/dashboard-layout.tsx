'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Menu, X, Bell,
  Home, Search, Package, MessageSquare, Star, CreditCard,
  Briefcase, Calendar, DollarSign, LogOut, User, ChevronRight, Settings
} from 'lucide-react'
import Link from 'next/link'
import LogoutModal from '@/app/components/logout-modal'

interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type: 'customer' | 'provider'
}

interface DashboardLayoutProps {
  children: ReactNode
  userType: 'customer' | 'provider'
  navigation: NavigationItem[]
}

interface NavigationItem {
  name: string
  href: string
  icon: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type: string
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Home, Search, Package, MessageSquare, Star, CreditCard, Bell, Settings,
    Briefcase, Calendar, DollarSign
  }
  return icons[iconName] || Home
}

export default function DashboardLayout({ children, userType, navigation }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  // Notification dropdown state
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) setSidebarCollapsed(JSON.parse(savedState))
    fetchUserProfile()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUserProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!profile) { router.push('/login'); return }

      setUser({
        id: profile.id,
        email: authUser.email ?? '',
        full_name: profile.full_name,
        user_type: profile.role ?? userType,
      })

      // Fetch notifications (gracefully handle missing table)
      try {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (notifs) {
          setNotifications(notifs)
          setUnreadCount(notifs.filter((n: NotificationItem) => !n.read).length)
        }
      } catch {
        // notifications table may not exist yet — fail silently
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const markNotifRead = async (id: string) => {
    try {
      const supabase = createClient()
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const settingsHref = userType === 'customer'
    ? '/settings'
    : '/dashboard/service_provider/settings'

  const notificationsHref = userType === 'customer'
    ? '/notifications'
    : '/dashboard/service_provider/notifications'

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-18' : 'w-60'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-[#3B82F6] rounded-full shadow-sm shadow-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm tracking-wider">BQ</span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900">Briqoly</h1>
                  <p className="text-xs text-gray-500">Service Platform</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = getIconComponent(item.icon)
              const isCurrent = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isCurrent
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-r-2 border-[#3B82F6]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#3B82F6]'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'flex-shrink-0'}`} />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-gray-200">
            {/* Logout Button */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {sidebarCollapsed ? (
                    <Menu className="w-5 h-5 text-gray-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                <div className="hidden lg:block">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {userType === 'customer' ? 'Customer Dashboard' : 'Service Provider Dashboard'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">

                {/* ── Notifications Bell ── */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <p className="font-bold text-gray-900 text-sm">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center">
                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 font-medium">All caught up!</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => { markNotifRead(n.id); setNotifOpen(false); router.push(notificationsHref) }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors relative ${!n.read ? 'bg-blue-50/50' : ''}`}
                            >
                              {!n.read && (
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#3B82F6] rounded-full" />
                              )}
                              <p className={`text-sm pl-2 leading-tight ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-400 pl-2 mt-0.5 line-clamp-1">{n.message}</p>
                              <p className="text-[10px] text-gray-300 pl-2 mt-1">{timeAgo(n.created_at)}</p>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-50 p-2">
                        <Link
                          href={notificationsHref}
                          onClick={() => setNotifOpen(false)}
                          className="block w-full text-center text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] py-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Profile Avatar ── */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
                    className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:opacity-90 transition-opacity"
                    aria-label="Profile menu"
                  >
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.user_type || 'Customer'}</p>
                    </div>
                    <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.full_name ? getInitials(user.full_name) : 'U'}
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Profile header */}
                      <div className="px-5 py-4 bg-gradient-to-br from-[#3B82F6] to-[#2563EB]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 border-2 border-white/40 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user?.full_name ? getInitials(user.full_name) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-blue-100 truncate">{user?.email || ''}</p>
                            <span className="inline-block text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full mt-1 capitalize">
                              {user?.user_type || 'Customer'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2">
                        <Link
                          href={settingsHref}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                        >
                          <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <User className="w-4 h-4 text-[#3B82F6]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Edit Profile</p>
                            <p className="text-xs text-gray-400">Update your personal information</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                        </Link>
                        <Link
                          href={notificationsHref}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors relative">
                            <Bell className="w-4 h-4 text-gray-600" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Notifications</p>
                            <p className="text-xs text-gray-400">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                        </Link>
                      </div>

                      <div className="border-t border-gray-50 p-2">
                        <button
                          onClick={() => { setProfileOpen(false); setIsLogoutModalOpen(true) }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-bold">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  )
}