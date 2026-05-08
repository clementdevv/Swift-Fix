'use client'

import React from 'react';
import { Search, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ActionCenterProps {
  hasActiveBooking: boolean;
  activeBookingStatus?: string;
  onSearch?: (query: string) => void;
}

export default function ActionCenter({ hasActiveBooking, activeBookingStatus, onSearch }: ActionCenterProps) {
  const [query, setQuery] = React.useState('');

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-orange-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 transition-opacity group-hover:opacity-80" />
      
      <div className="p-8 relative">
        <div className="max-w-2xl text-center mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
              What can we help you <span className="text-[#3B82F6]">fix</span> today?
            </h1>
            <p className="text-gray-500 font-medium italic">
              Connect with top-rated local professionals in seconds.
            </p>
          </div>

          {!hasActiveBooking ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50/80 p-2 rounded-2xl border border-gray-100 shadow-inner group-focus-within:border-blue-200 transition-all">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try 'Leaking pipe' or 'AC repair'..."
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && onSearch?.(query)}
                />
              </div>
              <Button 
                onClick={() => onSearch?.(query)}
                className="w-full sm:w-auto bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-7 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center gap-2 group transition-all active:scale-95"
              >
                Search Services
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
              </Button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-3 text-[#3B82F6]">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-widest opacity-60">Active Status</p>
                  <p className="font-bold text-lg">Your service is {activeBookingStatus || 'in progress'}</p>
                </div>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>Estimated 60%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-[#3B82F6] rounded-full w-[60%] animate-shimmer bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6] bg-[length:200%_100%]" />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
             {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry'].map(tag => (
               <button key={tag} className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-xs font-bold text-gray-400 hover:text-[#3B82F6] hover:border-blue-100 transition-all shadow-sm">
                 {tag}
               </button>
             ))}
          </div>
        </div>
      </div>
    </Card>
  );
}