'use client'

import { useState, useEffect } from 'react'
import RoleBasedRoute from '@/app/components/role-based-route'
import { useUserRole } from '@/app/hooks/use-user-role'
import {
  Users, 
  Wrench, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Settings,
  LogOut,
  Star,
  BarChart3,
  Shield,
  AlertTriangle
} from 'lucide-react'

// Mock data for admin dashboard
const ADMIN_STATS = {
  totalUsers: 1247,
  totalProviders: 342,
  totalCustomers: 905,
  totalBookings: 5689,
  revenue: 284750,
  pendingReviews: 156,
  activeBookings: 234,
  completedBookings: 5455
}

const RECENT_ACTIVITY = [
  { id: 1, type: 'new_user', user: 'John Doe', role: 'Provider', time: '2 minutes ago' },
  { id: 2, type: 'booking', user: 'Sarah Smith', service: 'Plumbing', time: '5 minutes ago' },
  { id: 3, type: 'review', user: 'Mike Johnson', rating: 5, time: '10 minutes ago' },
  { id: 4, type: 'revenue', amount: '$250', time: '15 minutes ago' },
  { id: 5, type: 'new_user', user: 'Emma Wilson', role: 'Customer', time: '20 minutes ago' }
]

function StatCard({ title, value, icon: Icon, color, trend }: {
  title: string
  value: string | number
  icon: any
  color: string
  trend?: number
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: any }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'new_user':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'booking':
        return <Calendar className="w-4 h-4 text-green-600" />
      case 'review':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'revenue':
        return <DollarSign className="w-4 h-4 text-purple-600" />
      default:
        return <Settings className="w-4 h-4 text-gray-600" />
    }
  }

  const getDescription = () => {
    switch (activity.type) {
      case 'new_user':
        return `New ${activity.role.toLowerCase()} registered`
      case 'booking':
        return `${activity.user} booked ${activity.service}`
      case 'review':
        return `${activity.user} left a ${activity.rating}-star review`
      case 'revenue':
        return `Earned ${activity.amount}`
      default:
        return 'System activity'
    }
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm text-gray-900">{getDescription()}</p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { userRole, loading, user } = useUserRole()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <RoleBasedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">Manage your service platform</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Welcome, {user?.user_metadata?.full_name || 'Admin'}</span>
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={ADMIN_STATS.totalUsers}
              icon={Users}
              color="bg-blue-100 text-blue-600"
              trend={12}
            />
            <StatCard
              title="Service Providers"
              value={ADMIN_STATS.totalProviders}
              icon={Wrench}
              color="bg-green-100 text-green-600"
              trend={8}
            />
            <StatCard
              title="Total Bookings"
              value={ADMIN_STATS.totalBookings}
              icon={Calendar}
              color="bg-purple-100 text-purple-600"
              trend={15}
            />
            <StatCard
              title="Revenue"
              value={`$${ADMIN_STATS.revenue.toLocaleString()}`}
              icon={DollarSign}
              color="bg-yellow-100 text-yellow-600"
              trend={23}
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Pending Reviews"
              value={ADMIN_STATS.pendingReviews}
              icon={Star}
              color="bg-orange-100 text-orange-600"
            />
            <StatCard
              title="Active Bookings"
              value={ADMIN_STATS.activeBookings}
              icon={TrendingUp}
              color="bg-indigo-100 text-indigo-600"
            />
            <StatCard
              title="Completed Bookings"
              value={ADMIN_STATS.completedBookings}
              icon={BarChart3}
              color="bg-teal-100 text-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-1">
                  {RECENT_ACTIVITY.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-500">View and manage all users</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Wrench className="w-6 h-6 text-green-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Providers</h3>
                    <p className="text-sm text-gray-500">Manage service providers</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Bookings</h3>
                    <p className="text-sm text-gray-500">View all bookings</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Star className="w-6 h-6 text-yellow-500 mb-2" />
                    <h3 className="font-medium text-gray-900">Reviews</h3>
                    <p className="text-sm text-gray-500">Manage reviews</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Revenue</h3>
                    <p className="text-sm text-gray-500">View revenue analytics</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Settings className="w-6 h-6 text-gray-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Settings</h3>
                    <p className="text-sm text-gray-500">System settings</p>
                  </button>
                </div>
              </div>

              {/* Alerts */}
              <div className="mt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-800">System Alert</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        3 providers require verification. Please review their applications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleBasedRoute>
  )
}
