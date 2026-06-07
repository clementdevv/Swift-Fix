
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim()
        const password = credentials?.password?.toString()

        if (!email || !password) return null

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            profile: {
              include: { providerProfile: true },
            },
          },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          userType: user.profile?.userType ?? 'CUSTOMER',
          onboardingCompleted: user.profile?.providerProfile?.onboardingCompleted ?? false,
        }
      },
    }),
  ],
})
