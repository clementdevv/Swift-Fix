
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      userType: 'customer' | 'provider'
      onboardingCompleted: boolean
    } & DefaultSession['user']
  }

  interface User {
    userType?: string
    onboardingCompleted?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    userType?: string
    onboardingCompleted?: boolean
  }
}