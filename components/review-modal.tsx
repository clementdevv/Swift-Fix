'use client'

import { useState } from 'react'
import { createReview } from '@/lib/actions/reviews'
import { X, Star, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  providerId: string
  providerName: string
  serviceName: string
}

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  providerId,
  providerName,
  serviceName
}: ReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createReview({
        bookingId,
        revieweeId: providerId,
        rating,
        comment,
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setRating(5)
        setComment('')
      }, 2000)

    } catch (err: any) {
      console.error('Review submission error:', err)
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Rate & Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Review Shared!</h3>
            <p className="text-gray-500">
              Thank you for sharing your experience with <strong>{providerName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="space-y-6">
              {/* Context Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500">How was your <strong>{serviceName}</strong> service with</p>
                <p className="text-lg font-bold text-gray-900">{providerName}?</p>
              </div>

              {/* Star Rating */}
              <div className="space-y-3 text-center">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Your Rating</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          (hoveredRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-amber-600 h-5">
                  { (hoveredRating || rating) === 5 ? 'Excellent!' :
                    (hoveredRating || rating) === 4 ? 'Great Service' :
                    (hoveredRating || rating) === 3 ? 'Good' :
                    (hoveredRating || rating) === 2 ? 'Fair' :
                    (hoveredRating || rating) === 1 ? 'Poor' : ''
                  }
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Your Experience
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={`Tell others about the job ${providerName} did for you...`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-50 placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-8 rounded-2xl text-lg font-bold shadow-lg shadow-blue-100 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                {loading ? 'Submitting...' : 'Post Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
