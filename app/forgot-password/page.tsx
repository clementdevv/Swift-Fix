'use client'

import { useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/utils/supabase/client'
import { forgotPassword } from '@/app/auth/actions'

function ForgotPasswordForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      setOtp((prev) => {
        const next = [...prev]
        digits.forEach((d, i) => { if (i < 6) next[i] = d })
        return next
      })
      const nextEmpty = digits.length < 6 ? digits.length : 5
      otpRefs.current[nextEmpty]?.focus()
      return
    }

    const sanitized = value.replace(/\D/g, '')
    setOtp((prev) => {
      const next = [...prev]
      next[index] = sanitized
      return next
    })

    if (sanitized && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }, [otp])

  const sendResetEmail = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('email', email)

      const result = await forgotPassword(formData)
      if (result?.error) {
        setError(result.error)
        return false
      }
      return true
    } catch {
      setError('Something went wrong. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await sendResetEmail()
    if (ok) setStep('otp')
  }

  const handleResend = async () => {
    await sendResetEmail()
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: 'recovery',
      })

      if (verifyError) {
        setError(verifyError.message)
        return
      }

      setStep('success')
      setTimeout(() => {
        router.push('/auth/reset-password')
      }, 1500)
    } catch {
      setError('Invalid code or connection error.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
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
                    Enter your email and we&apos;ll send you a 6-digit reset code.
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
                      'Send Reset Code'
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

            {step === 'otp' && (
              <>
                <div className="mb-8">
                  <h2 className="text-[22px] font-semibold text-gray-900">Verify Code</h2>
                  <p className="text-sm font-normal text-gray-500 mt-2">
                    We&apos;ve sent a 6-digit code to{' '}
                    <span className="font-medium text-gray-900">{email}</span>.
                    Check your spam folder if you don&apos;t see it.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Enter 6-digit code
                    </label>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onFocus={(e) => e.target.select()}
                          className="w-11 h-12 text-center text-lg font-bold border border-gray-300 bg-gray-50 rounded-lg text-gray-900 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                          maxLength={1}
                          required
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otp.join('').length !== 6}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null) }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Sending...' : "Didn't receive it? Resend code"}
                  </button>
                </div>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6]/10 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-[#3B82F6]" />
                </div>
                <h2 className="text-[22px] font-semibold text-gray-900">Code Verified!</h2>
                <p className="text-sm font-normal text-gray-500 mt-2">
                  Redirecting you to set a new password...
                </p>
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
