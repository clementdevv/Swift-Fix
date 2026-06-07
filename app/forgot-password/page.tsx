'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { forgotPassword } from '@/app/auth/actions'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('email', email)

      const result = await forgotPassword(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setStep('success')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6] rounded-full mb-3 shadow-md shadow-[#3B82F6]/20">
            <span className="text-white tracking-wider font-bold text-lg">BQ</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Briqoly</h1>
          <p className="text-xs font-normal text-gray-500 mt-1">Service Provider Platform</p>
        </div>

        <Card className="overflow-hidden border-0 shadow-[0_10px_25px_rgba(0,0,0,0.08)]" style={{ borderRadius: '12px' }}>
          <div className="p-8 bg-white">
            {step === 'email' && (
              <>
                <div className="mb-8">
                  <h2 className="text-[22px] font-semibold text-gray-900">Forgot password?</h2>
                  <p className="text-sm font-normal text-gray-500 mt-2">
                    Enter your email and we&apos;ll send reset instructions when email delivery is enabled.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                </div>

                <p className="text-center text-sm text-gray-700">
                  Remember your password?{' '}
                  <Link href="/login" className="text-[#3B82F6] hover:text-[#2563EB] font-medium transition-colors">
                    Back to login
                  </Link>
                </p>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6]/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-[#3B82F6]" />
                </div>
                <h2 className="text-[22px] font-semibold text-gray-900">Request received</h2>
                <p className="text-sm font-normal text-gray-500 mt-2">
                  If an account exists for <span className="font-medium text-gray-900">{email}</span>, you will
                  receive reset instructions once email delivery is configured.
                </p>
                <Button
                  asChild
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors mt-8"
                >
                  <Link href="/login">Back to login</Link>
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
