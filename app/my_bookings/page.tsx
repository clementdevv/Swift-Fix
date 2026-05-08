'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ProtectedRoute } from '@/components/protected-route'
import DashboardLayout from '@/components/dashboard-layout'
import { clientNavigation } from '@/lib/navigation'
import {
  Search, Star, Clock, CheckCircle, Filter,
  Droplet, Zap, Hammer, Wind, Shield, Wrench as Wrench2,
  Lightbulb, Thermometer, AlertCircle, Wrench, Users,
  Calendar, MapPin, ChevronRight, XCircle,
  RotateCcw, Package, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ReviewModal from '@/components/review-modal'

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'upcoming' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface Booking {
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, any> = {
  electrician: Zap,
  plumber: Droplet,
  cleaning: Shield,
  hvac: Wind,
  painting: Hammer,
  'pet handling': Users,
  carpentry: Hammer,
}

const SERVICE_ICONS: Record<string, any> = {
  // Common service categories (covers both your mock data + real DB data)
  electrician: Zap,
  electrical: Zap,
  plumber: Droplet,
  plumbing: Droplet,
  cleaning: Shield,
  hvac: Wind,
  painting: Hammer,
  'pet handling': Users,
  carpentry: Hammer,
  appliances: Wrench,
  roofing: Hammer,
  general: Wrench,
  // Add more as your service_categories table grows
  // Example: landscape: Leaf, etc. (import the icon first)
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  upcoming: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: RotateCcw,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
}

const TABS: { id: BookingStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Bookings' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-001',
    provider_id: '34b25bd8-56f6-410e-bb3b-560c0d0ecb4b',
    providerName: 'John Smith',
    providerAvatar: 'JS',
    providerRating: 4.8,
    service: 'Plumbing',
    serviceId: 'plumbing',
    status: 'upcoming',
    scheduledDate: 'Mon, Jul 14, 2025',
    scheduledTime: '10:00 AM – 12:00 PM',
    location: 'Downtown',
    estimatedDuration: '2 hours',
    estimatedCost: '$170',
    notes: 'Fix leaking kitchen sink and check bathroom pipes.',
    reviewed: false,
  },
  {
    id: 'BK-002',
    provider_id: 'c511f4f6-792b-44f7-84a1-1f9de59e963c',
    providerName: 'Sarah Johnson',
    providerAvatar: 'SJ',
    providerRating: 4.9,
    service: 'Electrical',
    serviceId: 'electrical',
    status: 'in_progress',
    scheduledDate: 'Mon, Jul 7, 2025',
    scheduledTime: '9:00 AM – 1:00 PM',
    location: 'Midtown',
    estimatedDuration: '4 hours',
    estimatedCost: '$380',
    notes: 'Install new circuit breaker and replace outlets in the living room.',
    reviewed: false,
  },
  {
    id: 'BK-003',
    provider_id: '34b25bd8-56f6-410e-bb3b-560c0d0ecb4b',
    providerName: 'Mike Rodriguez',
    providerAvatar: 'MR',
    providerRating: 4.7,
    service: 'Carpentry',
    serviceId: 'carpentry',
    status: 'completed',
    scheduledDate: 'Thu, Jun 26, 2025',
    scheduledTime: '2:00 PM – 5:00 PM',
    location: 'Westside',
    estimatedDuration: '3 hours',
    estimatedCost: '$225',
    actualCost: '$210',
    reviewed: true,
  },
  {
    id: 'BK-004',
    provider_id: '34b25bd8-56f6-410e-bb3b-560c0d0ecb4b',
    providerName: 'Lisa Chen',
    providerAvatar: 'LC',
    providerRating: 4.6,
    service: 'Appliances',
    serviceId: 'appliances',
    status: 'completed',
    scheduledDate: 'Fri, Jun 20, 2025',
    scheduledTime: '11:00 AM – 1:00 PM',
    location: 'Eastside',
    estimatedDuration: '2 hours',
    estimatedCost: '$140',
    actualCost: '$140',
    reviewed: false,
  },
  {
    id: 'BK-005',
    provider_id: 'f74ccd4b-bbac-4bf9-a647-100f23a30ddc',
    providerName: 'David Wilson',
    providerAvatar: 'DW',
    providerRating: 4.8,
    service: 'Roofing',
    serviceId: 'roofing',
    status: 'cancelled',
    scheduledDate: 'Wed, Jun 18, 2025',
    scheduledTime: '8:00 AM – 12:00 PM',
    location: 'Northside',
    estimatedDuration: '4 hours',
    estimatedCost: '$360',
    reviewed: false,
  },
  {
    id: 'BK-006',
    provider_id: 'c511f4f6-792b-44f7-84a1-1f9de59e963c',
    providerName: 'John Smith',
    providerAvatar: 'JS',
    providerRating: 4.8,
    service: 'General Repair',
    serviceId: 'general',
    status: 'upcoming',
    scheduledDate: 'Wed, Jul 16, 2025',
    scheduledTime: '3:00 PM – 5:00 PM',
    location: 'Downtown',
    estimatedDuration: '2 hours',
    estimatedCost: '$170',
    notes: 'General maintenance check for the garage door.',
    reviewed: false,
  },
]

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch (e) {
    return dateStr
  }
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 || 12
    return `${displayH}:${minutes} ${ampm}`
  } catch (e) {
    return timeStr
  }
}

// ─── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({ 
  booking, 
  onReview 
}: { 
  booking: Booking,
  onReview: (booking: Booking) => void
}) {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.upcoming
  const StatusIcon = status.icon
  const ServiceIcon = SERVICE_ICONS[booking.serviceId] ?? Wrench

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-[#93C5FD] transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {booking.providerAvatar}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{booking.providerName}</h3>
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-700">{booking.providerRating}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <ServiceIcon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-600">{booking.service}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${status.bg} ${status.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2 text-gray-600">
          <Calendar className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-800">{booking.scheduledDate}</p>
            <p className="text-xs text-gray-500">{booking.scheduledTime}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-800">{booking.location}</p>
            <p className="text-xs text-gray-500">{booking.estimatedDuration}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Service Description</p>
          <p className="text-sm text-gray-500 bg-gray-50 rounded-md px-3 py-2 line-clamp-3 border border-gray-100 italic">
            "{booking.notes}"
          </p>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        {/* Cost */}
        <div>
          {booking.status === 'completed' && booking.actualCost ? (
            <div>
              <span className="text-lg font-bold text-gray-900">{booking.actualCost}</span>
              <span className="text-xs text-gray-400 ml-1">final</span>
            </div>
          ) : (
            <div>
              <span className="text-lg font-bold text-[#3B82F6]">{booking.estimatedCost}</span>
              <span className="text-xs text-gray-400 ml-1">estimated</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {booking.status === 'completed' && !booking.reviewed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(booking)}
              className="text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50 font-bold"
            >
              <Star className="w-3 h-3 mr-1 fill-yellow-400" />
              Review
            </Button>
          )}

          <Link href={`/my_bookings/${booking.id}`}>
            <Button
              size="sm"
              className="text-xs bg-gray-900 hover:bg-black text-white"
            >
              Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date')

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
        .eq('customer_id', user.id)
        .order('scheduled_date', { ascending: false })

      if (error) throw error

      if (data) {
        const mappedBookings: Booking[] = data.map(b => ({
          id: b.id,
          provider_id: b.provider_id,
          providerName: b.service_providers?.business_name || 'Professional',
          providerAvatar: (b.service_providers?.business_name || 'P')[0].toUpperCase(),
          providerRating: 5.0,
          service: b.service_categories?.name || 'Service',
          serviceId: (b.service_categories?.name || '').toLowerCase(),
          status: b.status as BookingStatus,
          scheduledDate: formatDate(b.scheduled_date),
          scheduledTime: formatTime(b.scheduled_time),
          location: 'Remote/On-site',
          estimatedDuration: 'Flexible',
          estimatedCost: b.service_providers?.pricing_info || 'Quoted',
          notes: b.service_description,
          reviewed: Array.isArray(b.reviews) ? b.reviews.length > 0 : !!b.reviews
        }))
        setBookings(mappedBookings)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = useMemo(() => {
    let result = bookings

    if (activeTab !== 'all') {
      result = result.filter((b) => b.status === activeTab)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (b) =>
          b.providerName.toLowerCase().includes(q) ||
          b.service.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'cost') {
        const costA = parseFloat((a.actualCost ?? a.estimatedCost).replace(/[^0-9.]/g, '')) || 0
        const costB = parseFloat((b.actualCost ?? b.estimatedCost).replace(/[^0-9.]/g, '')) || 0
        return costB - costA
      }
      return b.scheduledDate.localeCompare(a.scheduledDate)
    })

    return result
  }, [bookings, activeTab, searchQuery, sortBy])

  const stats = useMemo(
    () => ({
      total: bookings.length,
      upcoming: bookings.filter((b) => b.status === 'upcoming' || b.status === 'confirmed' || b.status === 'pending').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    }),
    [bookings]
  )

  const pendingReviews = bookings.filter(
    (b) => b.status === 'completed' && !b.reviewed
  ).length

  return (
    <ProtectedRoute>
      <DashboardLayout userType="customer" navigation={clientNavigation}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Review Modal */}
          {selectedBookingForReview && (
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => {
                setIsReviewModalOpen(false)
                fetchBookings() // Refresh to hide review button
              }}
              bookingId={selectedBookingForReview.id}
              providerId={selectedBookingForReview.provider_id}
              providerName={selectedBookingForReview.providerName}
              serviceName={selectedBookingForReview.service}
            />
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600">Track and manage all your service appointments</p>
            </div>
            <Link href="/find_services">
              <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                Book a Service
              </Button>
            </Link>
          </div>

          {/* Pending Reviews Banner */}
          {pendingReviews > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                You have{' '}
                <span className="font-semibold">{pendingReviews} completed booking{pendingReviews > 1 ? 's' : ''}</span>{' '}
                awaiting your review. Your feedback helps the community!
              </p>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Bookings" value={stats.total} icon={Package} color="bg-blue-50 text-blue-600" />
            <StatCard label="Upcoming" value={stats.upcoming} icon={Clock} color="bg-sky-50 text-sky-600" />
            <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="bg-green-50 text-green-600" />
            <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="bg-red-50 text-red-500" />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by provider, service, location, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'cost')}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                >
                  <option value="date">Sort by Date</option>
                  <option value="cost">Sort by Cost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
            {TABS.map((tab) => {
              const count =
                tab.id === 'all'
                  ? bookings.length
                  : bookings.filter((b) => b.status === tab.id).length

              return (
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
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Results */}
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
            </p>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-6 h-64" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search query.'
                    : activeTab === 'all'
                    ? "You haven't made any bookings yet."
                    : `You have no ${STATUS_CONFIG[activeTab as BookingStatus]?.label.toLowerCase()} bookings.`}
                </p>
                <Link href="/find_services">
                  <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                    Find a Service Provider
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onReview={(b) => {
                      setSelectedBookingForReview(b)
                      setIsReviewModalOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}