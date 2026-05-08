'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import DashboardLayout from '@/components/dashboard-layout'
import { clientNavigation } from '@/lib/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User,
  Bell,
  Lock,
  Shield,
  MapPin,
  CreditCard,
  ChevronRight,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Profile {
  full_name: string
  phone: string
  location: string
  bio: string
  avatar_url: string
  email: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    avatar_url: '',
    email: ''
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // Password change state
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwMessage, setPwMessage] = useState('')

  const router = useRouter()

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          email: user.email || ''
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setSaveStatus('idle')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
        })
        .eq('id', user.id)

      if (error) {
        setSaveStatus('error')
        setSaveMessage(error.message)
      } else {
        setSaveStatus('success')
        setSaveMessage('Profile updated successfully!')
        // Reset after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err: any) {
      setSaveStatus('error')
      setSaveMessage('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      setPwStatus('error')
      setPwMessage("Passwords don't match.")
      return
    }
    if (passwords.newPass.length < 6) {
      setPwStatus('error')
      setPwMessage('Password must be at least 6 characters.')
      return
    }
    try {
      setChangingPw(true)
      setPwStatus('idle')
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
      if (error) {
        setPwStatus('error')
        setPwMessage(error.message)
      } else {
        setPwStatus('success')
        setPwMessage('Password updated successfully!')
        setPasswords({ current: '', newPass: '', confirm: '' })
        setTimeout(() => setPwStatus('idle'), 3000)
      }
    } catch (err: any) {
      setPwStatus('error')
      setPwMessage('Failed to update password.')
    } finally {
      setChangingPw(false)
    }
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <ProtectedRoute>
      <DashboardLayout userType="customer" navigation={clientNavigation}>
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account preferences and personal information.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar Navigation */}
            <aside className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === section.id
                      ? 'bg-blue-50 text-[#3B82F6] shadow-sm shadow-blue-200/50'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                  {activeTab === section.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </aside>

            {/* Content Area */}
            <div className="space-y-6">

              {/* ── Profile Tab ── */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-xl shadow-blue-500/5 bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 pb-12 pt-8">
                      <CardTitle className="text-white">Public Profile</CardTitle>
                      <CardDescription className="text-blue-100">
                        This information will be visible to service providers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative px-8 pb-8">
                      {loadingProfile ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] opacity-30" />
                        </div>
                      ) : (
                        <>
                          <div className="absolute -top-8 left-8">
                            <div className="relative">
                              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-blue-100 flex items-center justify-center text-3xl font-black text-[#3B82F6] shadow-lg">
                                {getInitials(profile.full_name)}
                              </div>
                              <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-gray-100 hover:bg-gray-50 transition-colors">
                                <Camera className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700">Full Name</label>
                              <Input
                                value={profile.full_name}
                                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                                className="bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl py-6 font-medium"
                                placeholder="Your full name"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700">Email Address</label>
                              <Input
                                value={profile.email}
                                disabled
                                className="bg-gray-100 border-gray-200 cursor-not-allowed rounded-xl py-6 font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700">Phone Number</label>
                              <Input
                                value={profile.phone}
                                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                                className="bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl py-6 font-medium"
                                placeholder="+1 (555) 000-0000"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700">Location</label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  value={profile.location}
                                  onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                                  className="pl-10 bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl py-6 font-medium"
                                  placeholder="City, State"
                                />
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-bold text-gray-700">Bio</label>
                              <textarea
                                value={profile.bio}
                                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                className="flex w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium shadow-sm transition-all focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-[#3B82F6] min-h-[90px] resize-none"
                                placeholder="Tell providers a little about yourself…"
                              />
                            </div>
                          </div>

                          {/* Status messages */}
                          {saveStatus === 'success' && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                              <p className="text-sm font-bold">{saveMessage}</p>
                            </div>
                          )}
                          {saveStatus === 'error' && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <p className="text-sm font-bold">{saveMessage}</p>
                            </div>
                          )}

                          <div className="mt-8 pt-8 border-t border-gray-50 flex justify-end">
                            <Button
                              onClick={handleSaveProfile}
                              disabled={saving}
                              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Notifications Tab ── */}
              {activeTab === 'notifications' && (
                <Card className="border-0 shadow-xl shadow-blue-500/5 bg-white rounded-2xl overflow-hidden p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Notification Preferences</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Manage how and when you receive alerts about your bookings.
                  </p>
                  <div className="space-y-1 mb-8">
                    <div className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive booking updates and receipts via email.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-4 border-t border-gray-50">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-500">Get instant alerts on your device for messages.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-4 border-t border-gray-50">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">Marketing &amp; Offers</p>
                        <p className="text-sm text-gray-500">Be first to know about discounts and promotions.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-3">View and manage your in-app notification history:</p>
                    <Link href="/notifications">
                      <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Go to Notification Center
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {/* ── Security Tab ── */}
              {activeTab === 'security' && (
                <Card className="border-0 shadow-xl shadow-blue-500/5 bg-white rounded-2xl overflow-hidden p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">New Password</label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={passwords.newPass}
                          onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                          className="bg-gray-50 border-gray-100 rounded-xl py-6 font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={passwords.confirm}
                            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                            className="bg-gray-50 border-gray-100 rounded-xl py-6 font-medium"
                          />
                        </div>
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
                        className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-6 rounded-xl"
                      >
                        {changingPw ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {changingPw ? 'Updating…' : 'Update Password'}
                      </Button>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 rounded-2xl">
                            <Shield className="w-6 h-6 text-[#3B82F6]" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">Keep your account secure with an added layer of security.</p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-gray-200 font-bold rounded-xl h-12">
                          Enable
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── Billing Tab ── */}
              {activeTab === 'billing' && (
                <Card className="border-0 shadow-xl shadow-blue-500/5 bg-white rounded-2xl overflow-hidden p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Methods</h3>
                  <div className="space-y-6">
                    <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-black rounded flex items-center justify-center text-white text-[10px] font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Visa ending in 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/2026</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-50 text-[#3B82F6] hover:bg-blue-50 border-0 font-bold">Primary</Badge>
                    </div>
                    <Button variant="outline" className="w-full border-dashed border-2 border-gray-200 h-16 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-300">
                      + Add New Payment Method
                    </Button>
                  </div>
                </Card>
              )}

            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}