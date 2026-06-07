'use client'

import { useState } from 'react'
import { createBooking } from '@/lib/actions/bookings'
import { useRouter } from 'next/navigation'
import { X, Calendar, Clock, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  providerId: string
  providerName: string
  categoryName: string
}

export default function BookingModal({
  isOpen,
  onClose,
  providerId,
  providerName,
  categoryName
}: BookingModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createBooking({
        providerId,
        categoryName,
        scheduledDate: date,
        scheduledTime: time,
        serviceDescription: description,
      })

      setSuccess(true)
      
      // Reset form state
      setDate('')
      setTime('')
      setDescription('')

      // Redirect after a short delay to show success state
      setTimeout(() => {
        router.push('/my_bookings')
        onClose()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Failed to create booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Book Service</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Booking Request Sent!</h3>
            <p className="text-gray-600">
              Your request for <strong>{categoryName}</strong> with <strong>{providerName}</strong> has been submitted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Info summary */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Provider: {providerName}</p>
                <p className="text-sm text-blue-700 capitalize">Service: {categoryName}</p>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Scheduled Date
                </label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Preferred Time
                </label>
                <Input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Job Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue or service you need help with..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] placeholder:text-gray-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-6 rounded-xl text-base font-bold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Processing...' : 'Confirm Booking Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
