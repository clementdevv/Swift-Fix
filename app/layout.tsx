
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/lib/supabase-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Local Pro - Service Provider Platform',
  description: 'Professional service management platform for technicians and service providers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}