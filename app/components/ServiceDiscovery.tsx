'use client'

import React from 'react';
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Zap, RefreshCw, Star, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export interface ServiceCategory {
  id: string;
  name: string;
  category: 'Emergency' | 'Routine';
  icon?: any;
  color?: string;
  description?: string;
}

interface ServiceDiscoveryProps {
  services: ServiceCategory[];
}

export default function ServiceDiscovery({ services }: ServiceDiscoveryProps) {
  const categories = [
    { id: 'emergency', name: 'Emergency', icon: Zap, color: 'text-red-500 bg-red-50', border: 'border-red-100', label: 'Urgent Fixes' },
    { id: 'routine', name: 'Routine', icon: RefreshCw, color: 'text-[#3B82F6] bg-blue-50', border: 'border-blue-100', label: 'Maintenance' },
  ]

  const getServiceIcon = (category: string) => {
    return category === 'Emergency' ? Zap : RefreshCw;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Explore Services</h2>
          <p className="text-sm text-gray-500 font-medium">Quick links to what you need most</p>
        </div>
        <Link href="/find_services" className="text-sm font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 transition-colors">
          View all services
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${cat.color} ${cat.border} border`}>
                <cat.icon className="w-4 h-4" />
              </div>
              <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">{cat.label}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {services
                .filter(s => s.category === cat.name)
                .map(service => (
                  <Card key={service.id} className="p-4 border-none shadow-sm bg-white hover:shadow-md transition-all group cursor-pointer hover:translate-y-[-2px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-[#3B82F6] transition-colors">{service.name}</h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              4.9 avg
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                              <ShieldCheck className="w-3 h-3 text-green-500" />
                              Verified
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link href={`/find_services?category=${service.name.toLowerCase()}`}>
                        <button className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-[#3B82F6] group-hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}