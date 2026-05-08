'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check, X, MapPin, Clock, Calendar, CheckCircle,
  AlertCircle, Loader2, RefreshCw, Briefcase,
  Info, User
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type JobStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'New Request',  color: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Confirmed',    color: 'bg-blue-100 text-blue-700' },
  upcoming:    { label: 'Confirmed',    color: 'bg-blue-100 text-blue-700' }, // legacy alias
  in_progress: { label: 'In Progress',  color: 'bg-purple-100 text-purple-700' },
  completed:   { label: 'Completed',    color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelled',    color: 'bg-red-100 text-red-700' },
}

export default function JobRequestsPage() {
  const [jobRequests, setJobRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'history'>('new')
  const router = useRouter()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setAuthError(null)
      const supabase = createClient()

      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (!user || authErr) {
        setAuthError('You must be logged in as a service provider to view job requests.')
        return
      }

      // Fetch ALL bookings for this provider (all statuses)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:customer_id (
            full_name,
            phone
          ),
          service_categories (
            name
          ),
          service_providers (
            pricing_info,
            business_name
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching jobs:', error)
        if (error.code === '42501' || error.message.includes('permission')) {
          setAuthError(
            'Permission denied. Please ensure the bookings table has the correct Row Level Security policies applied.'
          )
        } else {
          setAuthError(`Error loading jobs: ${error.message}`)
        }
        return
      }

      setJobRequests(data ?? [])
    } catch (err: any) {
      console.error('Error fetching jobs:', err)
      setAuthError('An unexpected error occurred while loading job requests.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    bookingId: string,
    newStatus: 'confirmed' | 'cancelled' | 'completed' | 'in_progress'
  ) => {
    try {
      setActionLoading(bookingId)
      const supabase = createClient()

      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) throw error

      // Refresh from server so both provider and client see the correct state
      router.refresh()
      // Also re-fetch local list
      await fetchJobs()
    } catch (err) {
      console.error(`Error updating job to ${newStatus}:`, err)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '—'
    try {
      const [hours, minutes] = timeStr.split(':')
      const h = parseInt(hours)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 || 12
      return `${displayH}:${minutes} ${ampm}`
    } catch {
      return timeStr
    }
  }

  // ── Tab Filtering ────────────────────────────────────────────────────────────
  const newRequests = jobRequests.filter(j => j.status === 'pending')
  const activeJobs  = jobRequests.filter(j => j.status === 'confirmed' || j.status === 'upcoming' || j.status === 'in_progress')
  const historyJobs = jobRequests.filter(j => j.status === 'completed' || j.status === 'cancelled')

  const displayedJobs =
    activeTab === 'new'    ? newRequests :
    activeTab === 'active' ? activeJobs  :
                             historyJobs

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and respond to client service bookings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {newRequests.length > 0 && (
            <Badge className="px-4 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold">
              {newRequests.length} New
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-2 text-gray-600 hover:text-[#3B82F6]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auth / Permission Error Banner */}
      {authError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Access Error</p>
            <p className="text-sm text-red-700 mt-0.5">{authError}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!authError && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(
            [
              { id: 'new',    label: 'New Requests', count: newRequests.length },
              { id: 'active', label: 'Active Jobs',  count: activeJobs.length },
              { id: 'history',label: 'History',      count: historyJobs.length },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id
                    ? 'bg-[#EFF6FF] text-[#3B82F6]'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
            <p>Loading job requests…</p>
          </div>
        ) : authError ? null : displayedJobs.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'new' ? (
                <Briefcase className="w-8 h-8 text-gray-300" />
              ) : activeTab === 'active' ? (
                <CheckCircle className="w-8 h-8 text-gray-300" />
              ) : (
                <Info className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'new'
                ? 'No New Requests'
                : activeTab === 'active'
                ? 'No Active Jobs'
                : 'No History Yet'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'new'
                ? 'New client booking requests will appear here when submitted.'
                : activeTab === 'active'
                ? 'Jobs you have confirmed will appear here.'
                : 'Completed or cancelled jobs will be listed here.'}
            </p>
          </div>
        ) : (
          displayedJobs.map(job => {
            const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending
            const clientName = job.profiles?.full_name || 'Client'
            const clientInitial = clientName[0].toUpperCase()

            return (
              <Card
                key={job.id}
                className="border-l-4 border-l-[#3B82F6] shadow-sm hover:shadow-md transition-shadow animate-in fade-in zoom-in duration-300"
              >
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      {/* Client Avatar */}
                      <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {clientInitial}
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {clientName}
                        </CardTitle>
                        <CardDescription className="font-semibold text-[#2563EB] mt-0.5 capitalize">
                          {job.service_categories?.name || 'General Service'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={`${statusCfg.color} border-none font-bold text-[10px] uppercase tracking-wider`}>
                        {statusCfg.label}
                      </Badge>
                      <span className="font-bold text-sm text-[#3B82F6]">
                        {job.service_providers?.pricing_info || 'Quoted'}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Schedule & Location */}
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex items-center text-gray-600 gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {formatDate(job.scheduled_date)}
                    </div>
                    <div className="flex items-center text-gray-600 gap-2">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {formatTime(job.scheduled_time)}
                    </div>
                    {job.location && (
                      <div className="flex items-center text-gray-600 gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {job.location}
                      </div>
                    )}
                  </div>

                  {/* Service Description */}
                  {job.service_description && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Client Instructions
                      </p>
                      <p className="text-sm text-gray-600 italic line-clamp-3">
                        &ldquo;{job.service_description}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    {job.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleAction(job.id, 'confirmed')}
                          disabled={!!actionLoading}
                          className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-sm font-bold h-10"
                        >
                          {actionLoading === job.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(job.id, 'cancelled')}
                          disabled={!!actionLoading}
                          className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 font-bold h-10"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    )}

                    {(job.status === 'confirmed' || job.status === 'upcoming') && (
                      <>
                        <Button
                          onClick={() => handleAction(job.id, 'in_progress')}
                          disabled={!!actionLoading}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-bold h-10"
                        >
                          {actionLoading === job.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Start Job
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(job.id, 'cancelled')}
                          disabled={!!actionLoading}
                          className="text-red-600 hover:bg-red-50 border-red-200 font-bold h-10 px-4"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {job.status === 'in_progress' && (
                      <Button
                        onClick={() => handleAction(job.id, 'completed')}
                        disabled={!!actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold h-10"
                      >
                        {actionLoading === job.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Completed
                          </>
                        )}
                      </Button>
                    )}

                    {(job.status === 'completed' || job.status === 'cancelled') && (
                      <div className={`w-full text-center text-sm font-semibold py-2 rounded-lg ${
                        job.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}>
                        {job.status === 'completed' ? '✓ Job Completed' : '✗ Declined / Cancelled'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
