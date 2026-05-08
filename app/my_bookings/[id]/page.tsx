'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ProtectedRoute } from '@/components/protected-route'
import DashboardLayout from '@/components/dashboard-layout'
import { clientNavigation } from '@/lib/navigation'
import ReviewModal from '@/components/review-modal'
import {
  ArrowLeft, Star, Clock, CheckCircle, RotateCcw,
  XCircle, Calendar, MapPin, Wrench, Droplet, Zap,
  Hammer, Wind, Shield, Lightbulb, Thermometer,
  AlertCircle, Loader2, FileText, User, Users, DollarSign,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled'

interface BookingDetail {
  id: string
  provider_id: string
  providerName: string
  providerAvatar: string
  providerRating: number
  service: string
  serviceId: string
  status: BookingStatus
  scheduledDate: string
  scheduledTime: string
  location: string
  estimatedDuration: string
  estimatedCost: string
  actualCost?: string
  notes?: string
  reviewed: boolean
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ElementType> = {
  plumber: Droplet,
  electrician: Zap,
  carpentry: Hammer,
  hvac: Wind,
  roofing: Shield,
  painting: Wrench,
  appliances: Lightbulb,
  heating: Thermometer,
  security: AlertCircle,
  general: Wrench,
  'pet handling': Users,
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Clock,
  },
  upcoming: {
    label: 'Upcoming',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: RotateCcw,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string) {
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

function formatCreatedAt(str: string) {
  try {
    return new Date(str).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return str
  }
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    if (bookingId) fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_providers (
            business_name,
            pricing_info
          ),
          service_categories (
            name
          ),
          reviews (
            id
          )
        `)
        .eq('id', bookingId)
        .eq('customer_id', user.id)
        .single()

      if (error || !data) {
        setNotFound(true)
        return
      }

      setBooking({
        id: data.id,
        provider_id: data.provider_id,
        providerName: data.service_providers?.business_name || 'Service Professional',
        providerAvatar: (data.service_providers?.business_name || 'S')[0].toUpperCase(),
        providerRating: 5.0,
        service: data.service_categories?.name || 'Service',
        serviceId: (data.service_categories?.name || '').toLowerCase(),
        status: data.status as BookingStatus,
        scheduledDate: formatDate(data.scheduled_date),
        scheduledTime: formatTime(data.scheduled_time),
        location: data.location || 'On-site / Remote',
        estimatedDuration: 'Flexible',
        estimatedCost: data.service_providers?.pricing_info || 'To be quoted',
        notes: data.service_description,
        reviewed: Array.isArray(data.reviews) ? data.reviews.length > 0 : !!data.reviews,
        createdAt: data.created_at,
      })
    } catch (err) {
      console.error('Error fetching booking detail:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] opacity-30" />
          <p className="text-gray-400 font-medium animate-pulse">Loading booking details…</p>
        </div>
      )
    }

    if (notFound || !booking) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Booking Not Found</h2>
          <p className="text-gray-500 max-w-sm">
            This booking doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/my_bookings">
            <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white mt-2">
              Back to My Bookings
            </Button>
          </Link>
        </div>
      )
    }

    const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.upcoming
    const StatusIcon = status.icon
    const ServiceIcon = SERVICE_ICONS[booking.serviceId] ?? Wrench

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Review Modal */}
        {isReviewModalOpen && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false)
              fetchBooking()
            }}
            bookingId={booking.id}
            providerId={booking.provider_id}
            providerName={booking.providerName}
            serviceName={booking.service}
          />
        )}

        {/* Back */}
        <Link
          href="/my_bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Bookings
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Provider Avatar */}
              <div className="w-14 h-14 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {booking.providerAvatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{booking.providerName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <ServiceIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-medium">{booking.service}</span>
                  <span className="text-gray-300">·</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-700">{booking.providerRating}</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold flex-shrink-0 ${status.bg} ${status.border} ${status.color}`}
            >
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </span>
          </div>

          {/* Booking ID */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Booking ID
            </p>
            <p className="text-sm font-mono text-gray-700 mt-0.5">{booking.id}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointment Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">Appointment Details</h2>
            <div className="divide-y divide-gray-100">
              <InfoRow icon={Calendar} label="Scheduled Date" value={booking.scheduledDate} />
              <InfoRow icon={Clock} label="Scheduled Time" value={booking.scheduledTime} />
              <InfoRow icon={MapPin} label="Location" value={booking.location} />
              <InfoRow icon={Clock} label="Estimated Duration" value={booking.estimatedDuration} />
            </div>
          </div>

          {/* Cost & Provider */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">Cost & Provider</h2>
            <div className="divide-y divide-gray-100">
              <InfoRow
                icon={DollarSign}
                label={booking.status === 'completed' && booking.actualCost ? 'Final Cost' : 'Estimated Cost'}
                value={
                  <span className="text-lg font-bold text-[#3B82F6]">
                    {booking.status === 'completed' && booking.actualCost
                      ? booking.actualCost
                      : booking.estimatedCost}
                  </span>
                }
              />
              <InfoRow icon={User} label="Service Provider" value={booking.providerName} />
              <InfoRow icon={FileText} label="Booking Placed" value={formatCreatedAt(booking.createdAt)} />
            </div>
          </div>
        </div>

        {/* Service Description */}
        {booking.notes && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">Service Description</h2>
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &ldquo;{booking.notes}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/my_bookings">
              <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookings
              </Button>
            </Link>

            {booking.status === 'completed' && !booking.reviewed && (
              <Button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm"
              >
                <Star className="w-4 h-4 mr-2 fill-white" />
                Leave a Review
              </Button>
            )}

            {booking.status === 'completed' && booking.reviewed && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                <CheckCircle className="w-4 h-4" />
                Review Submitted
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout userType="customer" navigation={clientNavigation}>
        {renderContent()}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
