'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight, Loader2, AlertCircle, Phone } from 'lucide-react'

interface ScheduledJob {
  id: string;
  title: string;
  client: string;
  phone: string;
  time: string;
  date: string;
  dateObj: Date;
  location: string;
  status: string;
}

export default function SchedulePage() {
  const [scheduleItems, setScheduleItems] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Date tracking for simple view changes
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchErr } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          scheduled_date,
          scheduled_time,
          created_at,
          location,
          service_categories ( name ),
          profiles:customer_id ( full_name, phone )
        `)
        .eq('provider_id', user.id)
        .in('status', ['accepted', 'confirmed', 'upcoming', 'in_progress'])
        .order('scheduled_date', { ascending: true })

      if (fetchErr) throw fetchErr

      const mapped: ScheduledJob[] = (data || []).map(b => {
        // Construct a proper Date object from the date and time strings
        let d = new Date(b.created_at)
        if (b.scheduled_date) {
          const timeStr = b.scheduled_time || '09:00'
          d = new Date(`${b.scheduled_date}T${timeStr}`)
        }

        // Supabase join results can sometimes be returned as arrays in TypeScript definitions
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
        const category = Array.isArray(b.service_categories) ? b.service_categories[0] : b.service_categories

        return {
          id: b.id,
          title: category?.name || 'General Service',
          client: profile?.full_name || 'Anonymous Client',
          phone: profile?.phone || '',
          time: b.scheduled_time || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: d.toLocaleDateString(),
          dateObj: d,
          location: b.location || 'Client location',
          status: b.status
        }
      })

      setScheduleItems(mapped)
    } catch (err: any) {
      setError('Failed to load your schedule.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helper to filter down to the exact selected date
  const selectedDateString = currentDate.toLocaleDateString()
  const todayJobs = scheduleItems.filter(item => item.date === selectedDateString)

  const changeDate = (days: number) => {
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + days)
    setCurrentDate(nextDate)
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  }

  const getDayLabel = () => {
    if (isToday(currentDate)) return `Today, ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Schedule Tracker</h1>
          <p className="text-slate-500 mt-1">Your upcoming appointments and accepted jobs.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8 hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <span className="text-sm font-bold text-slate-800 px-4 min-w-[140px] text-center">
            {getDayLabel()}
          </span>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-8 w-8 hover:bg-slate-100">
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-30 mb-3" />
          <p className="text-sm text-slate-400 font-medium animate-pulse">Checking your calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendar sidebar placeholder */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <CalendarIcon className="w-5 h-5 text-orange-500" />
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-sm text-center text-slate-500 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="font-medium text-slate-700 mb-2">Calendar View</p>
                  <p>Days with active bookings will be highlighted. Click arrows to navigate days.</p>
                  
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs">Accepted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-xs">In Progress</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Jobs for {isToday(currentDate) ? 'Today' : selectedDateString}
            </h3>
            
            {todayJobs.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-900 mb-1">Schedule Clear</h4>
                <p className="text-slate-500 max-w-xs mx-auto">You have no accepted or in-progress jobs scheduled for this date.</p>
              </div>
            ) : (
              todayJobs.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-orange-500 shadow-sm border-y-slate-200 border-r-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-r-orange-200 hover:border-y-orange-200 hover:-translate-y-0.5">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="bg-orange-50/30 p-6 flex flex-col justify-center sm:w-48 border-b sm:border-b-0 sm:border-r border-slate-100 text-center">
                        <span className="text-xl font-black text-orange-600 tracking-tight mb-0.5">{item.time}</span>
                      </div>
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">{item.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                            (item.status === 'confirmed' || item.status === 'upcoming') ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.status === 'in_progress' ? 'In Progress' : 
                             (item.status === 'confirmed' || item.status === 'upcoming') ? 'Confirmed' :
                             'Accepted'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-2 font-medium">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                               <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            {item.client}
                          </div>
                          
                          <div className="flex items-center gap-2 font-medium">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                               <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="truncate">{item.location}</span>
                          </div>
                          
                          {item.phone && (
                             <div className="flex items-center gap-2 font-medium sm:col-span-2 mt-1">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                 <Phone className="w-3.5 h-3.5 text-slate-500" />
                              </div>
                              <a href={`tel:${item.phone}`} className="text-orange-600 hover:underline">{item.phone}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <Button variant="outline" className="w-full mt-6 text-orange-600 border-orange-200 hover:bg-orange-50 font-bold py-6 rounded-xl">
              View All Upcoming Jobs
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
