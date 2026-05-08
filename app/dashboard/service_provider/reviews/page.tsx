'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, StarHalf, Loader2, MessageCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0]
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (full_name),
          bookings (
            service_categories (name)
          )
        `)
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setReviews(data)
        
        // Calculate stats
        const total = data.length
        if (total > 0) {
          const sum = data.reduce((acc, r) => acc + r.rating, 0)
          const avg = sum / total
          
          const dist = [0, 0, 0, 0, 0]
          data.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
              dist[5 - r.rating]++
            }
          })
          
          setStats({
            average: parseFloat(avg.toFixed(1)),
            total,
            distribution: dist.map(count => Math.round((count / total) * 100))
          })
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-200" />)
      }
    }
    return stars
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] opacity-20" />
        <p className="text-gray-400 font-medium animate-pulse">Loading your reviews...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-500 mt-1 font-medium">Hear what your local community has to say.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-[#3B82F6] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {stats.total} Total Reviews
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Overview Stats */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="text-center pb-2 bg-gray-50/50">
              <CardTitle className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Overall Performance</CardTitle>
              <div className="text-6xl font-black text-gray-900 mt-2">{stats.average > 0 ? stats.average : 'N/A'}</div>
              <div className="flex justify-center gap-1 mt-3">
                {renderStars(Math.round(stats.average))}
              </div>
              <p className="text-xs text-gray-400 mt-2 font-bold">Based on {stats.total} verified jobs</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[5, 4, 3, 2, 1].map((star, idx) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="text-xs font-black w-14 text-gray-400 uppercase tracking-tighter">{star} Stars</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${stats.distribution[idx]}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 w-8 text-right">{stats.distribution[idx]}%</div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <div className="bg-[#3B82F6] rounded-2xl p-6 text-white shadow-lg shadow-blue-100 relative overflow-hidden">
            <MessageCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
            <h4 className="font-bold mb-2">Build more trust!</h4>
            <p className="text-sm text-blue-50 opacity-90 leading-relaxed">
              Complete more jobs and ask clients for reviews to boost your ranking in search results.
            </p>
          </div>
        </div>

        {/* Review List */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Feedback</h3>
          </div>
          
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-gray-200" />
              </div>
              <div>
                <p className="text-gray-900 font-bold">No reviews yet</p>
                <p className="text-gray-400 text-sm">Completed jobs will appear here once rated.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {(review.profiles?.full_name || 'C')[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-[#3B82F6] transition-colors">
                            {review.profiles?.full_name || 'SwiftFix Client'}
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            {review.bookings?.service_categories?.name || 'Service Completed'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5 mb-1 justify-end">
                          {renderStars(review.rating)}
                        </div>
                        <div className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-gray-600 text-sm leading-relaxed italic border-l-2 border-gray-100 pl-4 py-1">
                        "{review.comment}"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
