import type { NextAuthConfig } from 'next-auth'
import { getAuthSecret } from '@/lib/env'

/** Maps Prisma enum CUSTOMER/PROVIDER → app's lowercase strings */
function mapUserType(prismaType?: string): 'customer' | 'provider' {
  return prismaType === 'PROVIDER' ? 'provider' : 'customer'
}

export const authConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.userType = (user as { userType?: string }).userType
        token.onboardingCompleted = (user as { onboardingCompleted?: boolean }).onboardingCompleted
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.userType = mapUserType(token.userType as string)
        session.user.onboardingCompleted = Boolean(token.onboardingCompleted)
      }
      return session
    },
  },
} satisfies NextAuthConfig
