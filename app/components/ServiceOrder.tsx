
// components/ServiceOrder.tsx
'use client'

import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export interface OrderItem {
  id: string
  title: string
  amount: string
  status: 'pending' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  date: string
}

interface ServiceOrderProps {
  orders?: OrderItem[]
}

export default function ServiceOrder({ orders }: ServiceOrderProps) {
  const displayOrders = orders || []

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-[#3B82F6]'
      case 'upcoming': return 'bg-[#EFF6FF] text-[#2563EB]'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-amber-100 text-amber-700'
    }
  }
  
  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      case 'upcoming': return 'Upcoming'
      case 'cancelled': return 'Cancelled'
      default: return 'Pending'
    }
  }
  
  return (
    <Card className="overflow-hidden animate-fade-in border-none shadow-sm bg-white">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent Service Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track service requests</p>
        </div>
        <Link href="/dashboard/service_provider/jobs">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors text-sm font-bold">
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </Link>
      </div>
      
      <div className="divide-y divide-gray-50">
        {displayOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm italic">
            No recent orders found.
          </div>
        ) : (
          displayOrders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{order.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{order.amount}</p>
                  <Link href={`/dashboard/service_provider/jobs`}>
                    <button className="mt-2 text-[#3B82F6] text-sm hover:text-[#2563EB] font-bold transition-colors">
                      View Details →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {displayOrders.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <Link href="/dashboard/service_provider/jobs" className="block w-full text-center text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium transition-colors">
            View All Orders
          </Link>
        </div>
      )}
    </Card>
  )
}