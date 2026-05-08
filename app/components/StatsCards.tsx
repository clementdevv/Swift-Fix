
// components/StatsCards.tsx
'use client'

import { DollarSign, Wrench, CheckCircle, Clock, LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatItem {
  title: string
  value: string | number
  change: string
  icon: LucideIcon
  color: string
}

interface StatsCardsProps {
  stats?: StatItem[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  // Default fallback if no stats provided
  const displayStats = stats || [
    { title: 'Total Revenue', value: '$0', change: '0%', icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { title: 'Active Orders', value: '0', change: '0%', icon: Wrench, color: 'bg-primary/10 text-primary' },
    { title: 'Completed', value: '0', change: '0%', icon: CheckCircle, color: 'bg-purple-100 text-purple-600' },
    { title: 'Pending', value: '0', change: '0%', icon: Clock, color: 'bg-primary/10 text-primary' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {displayStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="p-6 hover:shadow-md transition-shadow border-none shadow-sm bg-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-600' : 
                stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">{stat.title}</p>
          </Card>
        )
      })}
    </div>
  )
}