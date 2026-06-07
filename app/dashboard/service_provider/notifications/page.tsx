'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationAction,
} from '@/lib/actions/notifications'
import {
  Bell,
  Briefcase,
  DollarSign,
  MessageSquare,
  Star as StarIcon,
  CheckCircle2,
  Trash2,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Notification {
  id: string
  title: string
  message: string
  created_at: string
  type: string
  read: boolean
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ProviderNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getNotifications()
      setNotifications(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch { /* silent */ }
  }

  const markOneRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch { /* silent */ }
  }

  const deleteNotification = async (id: string) => {
    try {
      await deleteNotificationAction(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch { /* silent */ }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_request':   return <Briefcase className="w-5 h-5 text-blue-500" />
      case 'payment':           return <DollarSign className="w-5 h-5 text-green-500" />
      case 'message':           return <MessageSquare className="w-5 h-5 text-blue-400" />
      case 'review':            return <StarIcon className="w-5 h-5 text-orange-400" />
      case 'booking_confirmed': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'booking_cancelled': return <AlertCircle className="w-5 h-5 text-red-400" />
      default:                  return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-slate-500 mt-1">Manage your job alerts and system updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className="text-slate-600 border-slate-200 hover:bg-slate-50 font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={markAllAsRead}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm transition-colors"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Main Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-800">Recent Updates</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-slate-500">
              Total: {notifications.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-30 mb-3" />
              <p className="text-sm text-slate-400 font-medium animate-pulse">Loading alerts…</p>
            </div>
          ) : !error && notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markOneRead(notification.id)}
                  className={`group relative flex items-start gap-4 p-5 sm:p-6 transition-colors hover:bg-slate-50/80 cursor-pointer ${
                    !notification.read ? 'bg-orange-50/30' : 'bg-white'
                  }`}
                >
                  {/* Unread Dot */}
                  <div className="mt-2.5 w-2 flex-shrink-0 flex justify-center">
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-orange-500" />}
                  </div>

                  <div className="flex-shrink-0">
                    <div className={`p-2.5 rounded-full border shadow-sm ${
                      !notification.read ? 'bg-white border-orange-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-4 space-y-1">
                    <div className="flex sm:items-center flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <h3 className={`text-base tracking-tight ${!notification.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {timeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${!notification.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : !error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Quiet day...</h3>
              <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
                No new alerts right now. We'll notify you when jobs come in!
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
