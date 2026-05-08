'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Briefcase, MapPin, Phone, FileText, CheckCircle, ArrowRight,
  ArrowLeft, Zap, Droplet, Shield, Wind, Wrench, Users, Hammer,
  Lightbulb, Thermometer, AlertCircle, Loader2, X, Plus, Wrench as WrenchIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { completeProviderOnboarding } from '@/app/auth/actions'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ServiceCategory {
  id: string
  name: string
}

const FALLBACK_CATEGORIES: ServiceCategory[] = [
  { id: 'electrician', name: 'Electrician' },
  { id: 'plumber', name: 'Plumber' },
  { id: 'cleaning', name: 'Cleaner' },
  { id: 'hvac', name: 'HVAC' },
  { id: 'painting', name: 'Painter' },
  { id: 'pet handling', name: 'Pet Handler' },
  { id: 'carpentry', name: 'Carpenter' },
  { id: 'appliances', name: 'Appliance Repair' }
]

// ─── Static Icon Map ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  electrician: Zap,
  plumber: Droplet,
  cleaning: Shield,
  hvac: Wind,
  painting: WrenchIcon,
  pet_handling: Users,
  'pet handling': Users,
  carpentry: Hammer,
  appliances: Lightbulb,
  heating: Thermometer,
  security: AlertCircle,
  roofing: Shield,
  general: Wrench,
}

function getCategoryIcon(name: string): React.ElementType {
  const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
  return CATEGORY_ICONS[key] ?? Wrench
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ['Business Info', 'Services & Skills', 'Pricing & Payment']
  return (
    <div className="mb-10">
      <div className="flex items-center gap-0">
        {Array.from({ length: total }).map((_, i) => {
          const num = i + 1
          const isDone = step > num
          const isActive = step === num
          return (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isDone
                      ? 'bg-[#3B82F6] text-white'
                      : isActive
                      ? 'bg-[#3B82F6] text-white ring-4 ring-blue-100'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : num}
                </div>
                <span
                  className={`text-xs mt-2 font-semibold whitespace-nowrap ${
                    isActive ? 'text-[#3B82F6]' : isDone ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
              {num < total && (
                <div
                  className={`h-0.5 flex-1 mx-3 rounded-full mb-5 transition-all ${
                    step > num ? 'bg-[#3B82F6]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProviderOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [pendingAuthData, setPendingAuthData] = useState<{fullName: string, email: string, password: string} | null>(null)

  const [formData, setFormData] = useState({
    businessName: '',
    bio: '',
    phone: '',
    location: '',
    yearsExperience: '',
    selectedCategories: [] as string[],  // category id list
    skills: [] as string[],              // free-text tags
    pricingInfo: '',
    paymentMethod: '',
    paymentDetails: '',
  })

  // ── Auth guard + load categories ─────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      // 1. Check for pending registration data
      const storedData = sessionStorage.getItem('_pending_provider_signup')
      if (!storedData) {
        console.warn('No pending provider signup data found, redirecting to signup')
        router.replace('/signup')
        return
      }

      try {
        const parsedData = JSON.parse(storedData)
        setPendingAuthData(parsedData)
      } catch (e) {
        console.error('Failed to parse pending signup data', e)
        router.replace('/signup')
        return
      }

      const supabase = createClient()
      
      // 2. Fetch service categories from Supabase
      const { data: cats, error: fetchError } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('name', { ascending: true })

      if (fetchError) {
        console.warn('Could not fetch categories from Supabase (likely RLS). Using fallbacks.', fetchError)
        setCategories(FALLBACK_CATEGORIES)
      } else if (cats && cats.length > 0) {
        setCategories(cats)
      } else {
        console.warn('No categories found in service_categories table. Using fallbacks.')
        setCategories(FALLBACK_CATEGORIES)
      }

      setIsCheckingAuth(false)
    }

    init()
  }, [router])

  // ── Skill tag helpers ────────────────────────────────────────────────────

  const addSkill = () => {
    const tag = skillInput.trim()
    if (tag && !formData.skills.includes(tag)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, tag] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const toggleCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(id)
        ? prev.selectedCategories.filter(c => c !== id)
        : [...prev.selectedCategories, id],
    }))
  }

  // ── Validation ───────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    setError('')
    if (step === 1) {
      if (!formData.businessName.trim()) { setError('Business name is required.'); return false }
      if (!formData.bio.trim())          { setError('Bio is required.'); return false }
      if (!formData.phone.trim())        { setError('Phone number is required.'); return false }
    }
    if (step === 2) {
      if (formData.selectedCategories.length === 0) {
        setError('Please select at least one service category.')
        return false
      }
    }
    if (step === 3) {
      if (!formData.pricingInfo.trim())   { setError('Pricing information is required.'); return false }
      if (!formData.paymentMethod)        { setError('Please select a payment method.'); return false }
      if (!formData.paymentDetails.trim()){ setError('Payment details are required.'); return false }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1)
  }
  const prevStep = () => {
    setError('')
    setStep(s => s - 1)
  }

  // ── Final Submit ─────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return

    setIsLoading(true)
    setError('')

    try {
      if (!pendingAuthData) {
        throw new Error('Registration details missing. Please restart from the signup page.')
      }

      // Prepare a clean, plain object for the Server Action
      const payload = {
        authData: pendingAuthData,
        onboardingData: {
          business_name: formData.businessName.trim(),
          bio: formData.bio.trim(),
          phone: formData.phone.trim(),
          location: formData.location.trim() || null,
          years_exp: formData.yearsExperience || null,
          service_offered: Array.from(formData.selectedCategories),
          skills: Array.from(formData.skills),
          pricing_info: formData.pricingInfo.trim(),
          payment_method: formData.paymentMethod,
          payment_details: formData.paymentDetails.trim(),
        }
      }

      // Call the server action with a plain object only
      const result = await completeProviderOnboarding(payload)

      if (result.error) {
        throw new Error(result.error)
      }

      // Cleanup and redirect
      sessionStorage.removeItem('_pending_provider_signup')
      
      if (result.hasSession) {
        router.push('/dashboard/service_provider')
      } else {
        router.push(`/login?message=${encodeURIComponent(result.message || 'Please check your email to confirm your account')}`)
      }
    } catch (err: any) {
      console.error('Onboarding submit error:', err)
      setError(err.message || 'Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Loading screen ───────────────────────────────────────────────────────

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] opacity-40" />
      </div>
    )
  }

  // ── Step Content ─────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ─────────────── STEP 1: Business Info ────────────────────────────────
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
              <p className="text-gray-500 mt-1 text-sm">Tell clients about your business and expertise.</p>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.businessName}
                  onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))}
                  className="pl-10"
                  placeholder="e.g. Swift Electrical Services"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Professional Bio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  rows={4}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent placeholder:text-gray-400 resize-none"
                  placeholder="Describe your experience and what makes you great at what you do..."
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="pl-10"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            {/* Location & Experience (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Location <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="pl-10"
                    placeholder="e.g. Nairobi, Kenya"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Years of Experience <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.yearsExperience}
                  onChange={e => setFormData(p => ({ ...p, yearsExperience: e.target.value }))}
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>
        )

      // ─────────────── STEP 2: Services & Skills ─────────────────────────────
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Services & Skills</h2>
              <p className="text-gray-500 mt-1 text-sm">Choose your service categories and add specific skills.</p>
            </div>

            {/* Service Categories (from DB) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Service Categories <span className="text-red-500">*</span>
              </label>
              {categories.length === 0 ? (
                <div className="text-sm text-gray-400 italic">Loading categories…</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map(cat => {
                    const Icon = getCategoryIcon(cat.name)
                    const selected = formData.selectedCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selected
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#2563EB]'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate capitalize">{cat.name}</span>
                        {selected && <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Skill Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Additional Skills / Keywords <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Add specific skills to help clients find you (e.g. "solar panels", "CCTV installation").
              </p>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Type a skill and press Enter or Add"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSkill}
                  className="flex-shrink-0 text-[#3B82F6] border-[#3B82F6] hover:bg-[#EFF6FF]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.skills.map(skill => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      // ─────────────── STEP 3: Pricing & Payment ─────────────────────────────
      case 3:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pricing & Payment</h2>
              <p className="text-gray-500 mt-1 text-sm">Set your rates and preferred payment method.</p>
            </div>

            {/* Pricing Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Pricing Information <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.pricingInfo}
                onChange={e => setFormData(p => ({ ...p, pricingInfo: e.target.value }))}
                placeholder="e.g. Ksh 700 per visit, negotiable"
              />
              <p className="text-xs text-gray-400 mt-1.5">This is shown to clients on your profile card.</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Preferred Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              >
                <option value="">Select payment method…</option>
                <option value="mpesa">M-Pesa</option>
                <option value="till">Till Number</option>
                <option value="pochi">Pochi la Biashara</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>

            {/* Payment Details */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Payment Details <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.paymentDetails}
                onChange={e => setFormData(p => ({ ...p, paymentDetails: e.target.value }))}
                placeholder="e.g. 0712 345 678 or Till No: 123456"
              />
            </div>

            {/* Summary preview */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Profile Preview</p>
              <p className="text-sm text-gray-700 font-semibold">{formData.businessName || 'Your Business Name'}</p>
              <p className="text-sm text-gray-500 mt-0.5">{formData.bio?.slice(0, 80) || 'Your bio…'}{formData.bio?.length > 80 ? '…' : ''}</p>
              <p className="text-sm font-bold text-[#3B82F6] mt-1">{formData.pricingInfo || 'Your pricing'}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.selectedCategories.slice(0, 3).map(id => {
                  const cat = categories.find(c => c.id === id)
                  return cat ? (
                    <span key={id} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                      {cat.name}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3B82F6] rounded-xl mb-3 shadow-md shadow-blue-200">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Swift Fix — Provider Setup</h1>
          <p className="text-gray-500 text-sm mt-1">Complete your profile to start receiving job requests</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8">
          <StepIndicator step={step} total={3} />

          <form onSubmit={handleSubmit}>
            {renderStep()}

            {/* Error */}
            {error && (
              <div className="mt-5 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center gap-2 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 shadow-sm flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-sm flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up your profile…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-[#3B82F6] font-semibold hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
