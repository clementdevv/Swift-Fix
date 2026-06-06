'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

type SupabaseContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Use getUser() instead of getSession() for the initial check.
    // getSession() only reads from local storage and can return stale/null data
    // immediately after a server-action login before the browser client syncs.
    // getUser() makes a network request to Supabase, so it always reflects
    // the true server-side auth state.
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        // After confirming the user server-side, sync the local session cache
        const { data: { session } } = await supabase.auth.getSession()
        setUser(user ?? null)
        setSession(session ?? null)
      } catch {
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for subsequent auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <SupabaseContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}