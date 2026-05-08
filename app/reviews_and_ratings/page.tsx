'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import DashboardLayout from '@/components/dashboard-layout'
import { clientNavigation } from '@/lib/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Star, 
  Filter, 
  Search, 
  User, 
  TrendingUp, 
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'

// Define how the Review shape looks after parsing Supabase data
interface ReviewData {
  id: string;
  jobTitle: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerAvatar: string;
  revieweeName: string;
  revieweeAvatar: string;
  serviceType: string;
  date: string;
  helpful: number;
}

const SERVICE_TYPES = ['All', 'Plumbing', 'Electrical', 'HVAC', 'General Repair', 'Appliances', 'Pet Handling', 'Cleaning', 'Painting', 'Carpentry']
const RATING_FILTERS = ['All', 5, 4, 3, 2, 1]
const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Rating', 'Lowest Rating', 'Most Helpful']

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review, onVoteHelpful }: { review: ReviewData, onVoteHelpful: (id: string) => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
            {review.reviewerAvatar || 'U'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{review.reviewerName || 'Anonymous'}</div>
            <div className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap">
            {review.serviceType}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
        {/* Rating */}
        <div className="flex items-center gap-2">
           <StarRating rating={review.rating} />
           <span className="text-sm font-bold text-gray-700">{review.rating.toFixed(1)}/5 Stars</span>
        </div>
        <div className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
           Provider: {review.revieweeName}
        </div>
      </div>

      {/* Comment */}
      <p className="text-gray-700 mb-4 leading-relaxed italic">"{review.comment}"</p>

      {/* Helpful Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button 
          onClick={() => onVoteHelpful(review.id)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-blue-100"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">Helpful ({review.helpful})</span>
        </button>
      </div>
    </div>
  )
}

export default function ReviewsAndRatingsPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedService, setSelectedService] = useState('All')
  const [selectedRating, setSelectedRating] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error: fetchErr } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          helpful_votes,
          bookings (
             service_categories ( name )
          ),
          reviewer:reviewer_id ( full_name ),
          reviewee:reviewee_id ( full_name )
        `)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      const formatted = (data as any[]).map(r => ({
        id: r.id,
        rating: r.rating || 0,
        comment: r.comment || '',
        date: r.created_at,
        helpful: r.helpful_votes || 0,
        reviewerName: r.reviewer?.full_name || 'User',
        reviewerAvatar: r.reviewer?.full_name?.substring(0, 2).toUpperCase() || 'U',
        revieweeName: r.reviewee?.full_name || 'Provider',
        revieweeAvatar: r.reviewee?.full_name?.substring(0, 2).toUpperCase() || 'P',
        serviceType: r.bookings?.service_categories?.name || 'General Service',
        jobTitle: `${r.bookings?.service_categories?.name || 'Service'} Job`
      }))

      setReviews(formatted)
    } catch (err: any) {
      console.error(err)
      setError('Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  const handleVoteHelpful = async (id: string) => {
    try {
      // Optimistic UP
      setReviews(prev => prev.map(r => r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
      
      const supabase = createClient()
      const review = reviews.find(r => r.id === id)
      if (!review) return
      
      await supabase.from('reviews').update({ helpful_votes: review.helpful + 1 }).eq('id', id)
    } catch {
       // Revert
       setReviews(prev => prev.map(r => r.id === id ? { ...r, helpful: Math.max(0, r.helpful - 1) } : r))
    }
  }

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      const matchesSearch = review.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.revieweeName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesService = selectedService === 'All' || review.serviceType.toLowerCase() === selectedService.toLowerCase()
      const matchesRating = selectedRating === 'All' || review.rating === parseInt(selectedRating)
      
      return matchesSearch && matchesService && matchesRating
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'Oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'Highest Rating':
          return b.rating - a.rating
        case 'Lowest Rating':
          return a.rating - b.rating
        case 'Most Helpful':
          return b.helpful - a.helpful
        default:
          return 0
      }
    })

  // Calculate statistics
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0'
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }))

  return (
    <ProtectedRoute>
      <DashboardLayout navigation={clientNavigation} userType="customer">
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Community Reviews & Ratings</h1>
            <p className="text-gray-500">Read what other homeowners are saying about their service providers.</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center shadow-blue-500/5">
              <span className="text-gray-500 font-bold tracking-wider uppercase text-xs mb-3 block">Overall Rating</span>
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">{averageRating}<span className="text-2xl text-gray-400">/5</span></span>
                <StarRating rating={Math.round(parseFloat(averageRating))} size="lg" />
                <span className="text-sm text-gray-400 mt-1">Based on {reviews.length} reviews</span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 w-16">
                      <span className="text-sm font-bold text-gray-700">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-500 w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reviews by comment or provider..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Service Category</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_TYPES.map(service => (
                        <button
                          key={service}
                          onClick={() => setSelectedService(service)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            selectedService === service
                              ? 'bg-[#3B82F6] text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Star Rating</label>
                    <div className="flex flex-wrap gap-2">
                      {RATING_FILTERS.map(rating => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(rating.toString())}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
                            selectedRating === rating.toString()
                              ? 'bg-yellow-400 text-yellow-900 shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {rating === 'All' ? 'All Ratings' : (
                            <><Star className={`w-3 h-3 ${selectedRating === rating.toString() ? 'fill-yellow-900 text-yellow-900' : 'fill-gray-400 text-gray-400'}`} /> {rating}</>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-24">
                 <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] opacity-30 mb-3" />
                 <p className="text-sm text-gray-400 font-medium animate-pulse">Loading community reviews...</p>
               </div>
            ) : filteredReviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {filteredReviews.map(review => (
                   <ReviewCard key={review.id} review={review} onVoteHelpful={handleVoteHelpful} />
                 ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}