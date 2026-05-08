
// components/QuickActions.tsx
'use client'

import { Wrench, FileText, Users, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

const actions = [
  { icon: Wrench, label: 'New Repair', color: 'bg-primary/10 text-primary' },
  { icon: FileText, label: 'Create Invoice', color: 'bg-primary/10 text-primary' },
  { icon: Users, label: 'Add Customer', color: 'bg-purple-100 text-purple-600' },
  { icon: Calendar, label: 'Schedule', color: 'bg-primary/10 text-primary' },
]

export default function QuickActions() {
  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className={`p-3 rounded-xl ${action.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}