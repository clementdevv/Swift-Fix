'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bell,
  Lock,
  Shield,
  CreditCard,
  ChevronRight,
  Camera,
  Briefcase,
  Clock,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getProviderSettings, updateProviderSettings } from '@/lib/actions/providers'
import Link from 'next/link'

interface ProviderProfile {
  full_name: string
  phone: string
  location: string
  bio: string
  email: string
  business_name: string
  primary_service: string
}

export default function ProviderSettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [profile, setProfile] = useState<ProviderProfile>({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    email: '',
    business_name: '',
    primary_service: ''
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // Password state
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwMessage, setPwMessage] = useState('')

  const router = useRouter()

  const sections = [
    { id: 'business',      label: 'Business Profile',  icon: Briefcase },
    { id: 'availability',  label: 'Availability',       icon: Clock },
    { id: 'notifications', label: 'Notifications',      icon: Bell },
    { id: 'payouts',       label: 'Payouts & Billing',  icon: CreditCard },
    { id: 'security',      label: 'Security',            icon: Lock },
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true)
      const data = await getProviderSettings()
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      router.push('/login')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setSaveStatus('idle')
      await updateProviderSettings({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        business_name: profile.business_name,
        primary_service: profile.primary_service,
      })
      setSaveStatus('success')
      setSaveMessage('Profile updated successfully!')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setSaveStatus('error')
      setSaveMessage(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      setPwStatus('error'); setPwMessage("Passwords don't match."); return
    }
    if (passwords.newPass.length < 6) {
      setPwStatus('error'); setPwMessage('Password must be at least 6 characters.'); return
    }
    try {
      setChangingPw(true)
      setPwStatus('error')
      setPwMessage('Password change via email is not yet configured.')
    } catch (err: any) {
      setPwStatus('error'); setPwMessage('Failed to update password.')
    } finally {
      setChangingPw(false)
    }
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'SP'

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Provider Settings</h1>
        <p className="text-gray-500 mt-1">Configure your business profile, availability, and payout preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar Navigation */}
        <aside className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === section.id
                  ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-200/30'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
              {activeTab === section.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="space-y-6">

          {/* ── Business Profile ── */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl shadow-orange-500/5 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 pb-12 pt-8">
                  <CardTitle className="text-white">Professional Profile</CardTitle>
                  <CardDescription className="text-orange-100 font-medium">
                    This information helps clients find and trust your services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative px-8 pb-8">
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-400 opacity-30" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute -top-10 left-8">
                        <div className="relative">
                          <div className="w-28 h-28 rounded-3xl border-4 border-white bg-orange-100 flex items-center justify-center text-4xl font-black text-orange-600 shadow-xl">
                            {getInitials(profile.full_name || profile.business_name)}
                          </div>
                          <button className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-2xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-all hover:scale-110">
                            <Camera className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                          <Input
                            value={profile.full_name}
                            onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                            className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-2xl py-7 font-semibold text-gray-900"
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">Business Name</label>
                          <Input
                            value={profile.business_name}
                            onChange={e => setProfile(p => ({ ...p, business_name: e.target.value }))}
                            className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-2xl py-7 font-semibold text-gray-900"
                            placeholder="Your business name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">Primary Service</label>
                          <Input
                            value={profile.primary_service}
                            onChange={e => setProfile(p => ({ ...p, primary_service: e.target.value }))}
                            className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-2xl py-7 font-semibold text-gray-900"
                            placeholder="e.g. Electrical Repair"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">Work Email</label>
                          <Input
                            value={profile.email}
                            disabled
                            className="bg-gray-100 border-gray-200 cursor-not-allowed rounded-2xl py-7 font-semibold text-gray-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                          <Input
                            value={profile.phone}
                            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                            className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-2xl py-7 font-semibold text-gray-900"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">Location / Service Area</label>
                          <Input
                            value={profile.location}
                            onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                            className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-2xl py-7 font-semibold text-gray-900"
                            placeholder="City, State"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">About Your Business</label>
                          <textarea
                            value={profile.bio}
                            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                            className="flex w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-medium shadow-sm transition-all focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 min-h-[120px] resize-none"
                            placeholder="Describe your expertise and services…"
                          />
                        </div>
                      </div>

                      {/* Status messages */}
                      {saveStatus === 'success' && (
                        <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                          <CheckCircle2 className="w-4 h-4" />
                          <p className="text-sm font-bold">{saveMessage}</p>
                        </div>
                      )}
                      {saveStatus === 'error' && (
                        <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-sm font-bold">{saveMessage}</p>
                        </div>
                      )}

                      <div className="mt-10 pt-8 border-t border-gray-50 flex justify-end">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-7 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {saving ? 'Saving…' : 'Save Profile Changes'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Availability ── */}
          {activeTab === 'availability' && (
            <Card className="border-0 shadow-xl shadow-orange-500/5 bg-white rounded-3xl overflow-hidden p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Work Schedule</h3>
                  <p className="text-gray-500 font-medium">Set your weekly operating hours and service areas.</p>
                </div>
                <Badge className="bg-green-50 text-green-600 border-0 font-bold px-4 py-2 rounded-xl">Currently Accepting Jobs</Badge>
              </div>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center justify-between p-5 rounded-2xl border border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-4">
                      <Switch defaultChecked />
                      <span className="font-bold text-gray-800 w-24">{day}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold shadow-sm">09:00 AM</div>
                      <span className="text-gray-400 font-bold">to</span>
                      <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 text-sm font-bold shadow-sm">06:00 PM</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <Card className="border-0 shadow-xl shadow-orange-500/5 bg-white rounded-3xl overflow-hidden p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Provider Alerts</h3>
              <p className="text-sm text-gray-500 mb-6">Control which job alerts you receive.</p>
              <div className="space-y-1 mb-8">
                <div className="flex items-center justify-between py-5 px-4 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-extrabold text-gray-900">New Job Requests</p>
                    <p className="text-sm text-gray-500 font-medium">Get instant push notifications for local service requests.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-5 px-4 rounded-2xl hover:bg-gray-50 transition-colors border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="font-extrabold text-gray-900">Payment Confirmations</p>
                    <p className="text-sm text-gray-500 font-medium">Receive alerts when clients process payments.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-5 px-4 rounded-2xl hover:bg-gray-50 transition-colors border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="font-extrabold text-gray-900">Message Alerts</p>
                    <p className="text-sm text-gray-500 font-medium">Notification when a client sends a message.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500 mb-3">View your full notification history:</p>
                <Link href="/dashboard/service_provider/notifications">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Go to Notification Center
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* ── Payouts ── */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-xl shadow-orange-500/5 bg-white rounded-3xl overflow-hidden p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Payout Settings</h3>
                <div className="p-6 border-2 border-orange-100 rounded-3xl bg-orange-50/30 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center">
                      <Globe className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Direct Deposit via Stripe</p>
                      <p className="text-sm text-gray-500 font-medium">Payouts are sent weekly to your bank.</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-500 text-white border-0 font-bold px-4 py-2 rounded-xl">Verified Account</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Bank Account ending in</label>
                    <Input defaultValue="**** 4567" disabled className="bg-gray-100 border-gray-200 rounded-2xl py-7 font-bold text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Next Expected Payout</label>
                    <Input defaultValue="—" disabled className="bg-gray-100 border-gray-200 rounded-2xl py-7 font-bold text-gray-500" />
                  </div>
                </div>
                <Button className="w-full mt-8 bg-gray-900 hover:bg-black text-white font-black py-7 rounded-2xl">
                  Update Payout Method
                </Button>
              </Card>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <Card className="border-0 shadow-xl shadow-orange-500/5 bg-white rounded-3xl overflow-hidden p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Account Security</h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={passwords.newPass}
                      onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                      className="bg-gray-50/50 border-gray-100 rounded-2xl py-7 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      className="bg-gray-50/50 border-gray-100 rounded-2xl py-7 font-semibold"
                    />
                  </div>

                  {pwStatus === 'success' && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <p className="text-sm font-bold">{pwMessage}</p>
                    </div>
                  )}
                  {pwStatus === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm font-bold">{pwMessage}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPw}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-orange-500/10"
                  >
                    {changingPw ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {changingPw ? 'Updating…' : 'Change Password'}
                  </Button>
                </div>

                <div className="pt-8 border-t border-gray-50">
                  <div className="p-6 bg-gray-50/50 rounded-3xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-orange-100 rounded-2xl">
                        <Shield className="w-7 h-7 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">Enhanced Privacy Mode</p>
                        <p className="text-sm text-gray-500 font-medium">Hide your profile from search when your schedule is full.</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
