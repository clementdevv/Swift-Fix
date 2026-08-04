'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resetPassword } from '@/app/auth/actions'
import { AUTH_STRINGS } from '@/lib/constants/auth'
import {
  getPasswordStrength,
  passwordsMatch,
  validatePassword,
} from '@/lib/validation/password'

function ResetPasswordForm() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordsAreMatching = passwordsMatch(formData.password, formData.confirmPassword)
  const passwordValidation = validatePassword(formData.password)
  const canSubmit =
    passwordValidation.valid &&
    passwordsAreMatching &&
    formData.confirmPassword.length > 0

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-600'
    if (passwordStrength <= 3) return 'bg-amber-500'
    return 'bg-[#3B82F6]'
  }

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validation = validatePassword(formData.password)
    if (!validation.valid) {
      setError(validation.error ?? AUTH_STRINGS.passwordTooShort)
      return
    }

    if (!passwordsMatch(formData.password, formData.confirmPassword)) {
      setError(AUTH_STRINGS.passwordsDoNotMatch)
      return
    }

    setIsLoading(true)

    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('password', formData.password)
      formDataToSubmit.append('confirmPassword', formData.confirmPassword)

      const result = await resetPassword(formDataToSubmit)

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.success) {
        router.push(`/login?message=${encodeURIComponent(result.message ?? AUTH_STRINGS.resetPasswordSuccess)}`)
      }
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
            <div className="mb-8">
              <h2 className="text-[22px] font-semibold text-gray-900">Reset Password</h2>
              <p className="text-sm font-normal text-gray-500 mt-2">
                Enter a new password for your account.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full ${
                            passwordStrength >= level ? getStrengthColor() : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs font-bold ${
                        passwordStrength <= 2
                          ? 'text-red-600'
                          : passwordStrength <= 3
                            ? 'text-amber-600'
                            : 'text-[#3B82F6]'
                      }`}
                    >
                      Password strength: {getStrengthText()}
                    </p>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  8+ characters, includes a special symbol
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsAreMatching && (
                  <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && passwordsAreMatching && formData.password && (
                  <p className="mt-1 text-xs text-[#3B82F6] font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-700 mt-6">
              <Link href="/login" className="text-[#3B82F6] hover:text-[#2563EB] font-medium transition-colors">
                Back to login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
