
// components/RecentActivity.tsx
'use client'

import { User, Wrench, FileText, LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ActivityItem {
  id: string | number
  type: string
  title: string
  description: string
  time: string
  icon: LucideIcon
  color: string
}

interface RecentActivityProps {
  activities?: ActivityItem[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const displayActivities = activities || []

  return (
    <Card className="overflow-hidden animate-fade-in border-none shadow-sm bg-white">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-sm text-gray-500 mt-1">Latest updates from your services</p>
      </div>
      
      <div className="divide-y divide-gray-50">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm italic">
            No recent activity to display.
          </div>
        ) : (
          displayActivities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${activity.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {displayActivities.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <button className="w-full text-center text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium transition-colors">
            View All Activity
          </button>
        </div>
      )}
    </Card>
  )
}