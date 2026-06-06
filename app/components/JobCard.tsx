'use client'

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, MessageSquare, ChevronRight, MapPin, Clock } from 'lucide-react'

export interface Job {
  id: string;
  serviceType: string;
  providerName: string;
  status: 'pending' | 'upcoming' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  date?: string;
  time?: string;
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':     return { label: 'Pending',     color: 'bg-amber-100 text-amber-700' };
      case 'upcoming':    return { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700' };
      case 'confirmed':   return { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700' };
      case 'in_progress': return { label: 'In Progress', color: 'bg-[#EFF6FF] text-[#3B82F6]' };
      case 'completed':   return { label: 'Completed',   color: 'bg-green-100 text-green-700' };
      case 'cancelled':   return { label: 'Cancelled',   color: 'bg-red-100 text-red-700' };
      default:            return { label: status,        color: 'bg-gray-100 text-gray-700' };
    }
  };

  const config = getStatusConfig(job.status);

  return (
    <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#3B82F6] font-black text-xs shadow-inner">
            {(job.providerName || 'P')[0]}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3B82F6] transition-colors">{job.serviceType}</h3>
              <Badge className={`${config.color} border-none font-bold text-[10px] uppercase tracking-widest px-2 py-0.5`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 font-medium">with <span className="text-gray-900">{job.providerName}</span></p>
            
            <div className="flex items-center gap-4 pt-1">
              {job.date && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                  <Clock className="w-3 h-3" />
                  {job.date}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                <MapPin className="w-3 h-3" />
                On-site
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <button className="flex-1 md:flex-none p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors shadow-sm ring-1 ring-gray-100">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="flex-1 md:flex-none p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors shadow-sm ring-1 ring-gray-100">
            <Phone className="w-4 h-4" />
          </button>
          <Link href={`/my_bookings/${job.id}`} className="flex-[2] md:flex-none">
            <button className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-bold text-sm flex items-center justify-center gap-2 group/btn">
              Details
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}