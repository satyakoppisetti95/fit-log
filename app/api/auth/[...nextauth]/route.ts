import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

async function loadUserPreferences(userId: string) {
  try {
    await connectDB()
    const user = await User.findById(userId).select('theme accentColor weightUnit lengthUnit volumeUnit weightGoal stepsGoal waterGoal')
    return {
      theme: (user?.theme as 'light' | 'dark') || 'dark',
      accentColor: (user?.accentColor as 'green' | 'blue' | 'orange' | 'purple') || 'green',
      weightUnit: (user?.weightUnit as 'kg' | 'lb') || 'kg',
      lengthUnit: (user?.lengthUnit as 'm' | 'ft') || 'm',
      volumeUnit: (user?.volumeUnit as 'ml' | 'fl oz') || 'ml',
      weightGoal: user?.weightGoal,
      stepsGoal: user?.stepsGoal,
      waterGoal: user?.waterGoal,
    }
  } catch (error) {
    console.error('Error loading user preferences:', error)
    return {
      theme: 'dark' as const,
      accentColor: 'green' as const,
      weightUnit: 'kg' as const,
      lengthUnit: 'm' as const,
      volumeUnit: 'ml' as const,
      weightGoal: undefined,
      stepsGoal: undefined,
      waterGoal: undefined,
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          await connectDB()
          const user = await verifyPassword(credentials.username, credentials.password)
          
          if (user) {
            return {
              id: user.id,
              name: user.username,
              email: null,
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        
      // Load user preferences from database
      const preferences = await loadUserPreferences(user.id)
      token.theme = preferences.theme
      token.accentColor = preferences.accentColor
      token.weightUnit = preferences.weightUnit
      token.lengthUnit = preferences.lengthUnit
      token.volumeUnit = preferences.volumeUnit
      token.weightGoal = preferences.weightGoal
      token.stepsGoal = preferences.stepsGoal
      token.waterGoal = preferences.waterGoal
      }
      
      // Refresh preferences when session is updated
      if (trigger === 'update' && token.id) {
        const preferences = await loadUserPreferences(token.id as string)
        token.theme = preferences.theme
        token.accentColor = preferences.accentColor
        token.weightUnit = preferences.weightUnit
        token.lengthUnit = preferences.lengthUnit
        token.volumeUnit = preferences.volumeUnit
        token.weightGoal = preferences.weightGoal
        token.stepsGoal = preferences.stepsGoal
        token.waterGoal = preferences.waterGoal
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.theme = (token.theme as 'light' | 'dark') || 'dark'
        session.user.accentColor = (token.accentColor as 'green' | 'blue' | 'orange' | 'purple') || 'green'
        session.user.weightUnit = (token.weightUnit as 'kg' | 'lb') || 'kg'
        session.user.lengthUnit = (token.lengthUnit as 'm' | 'ft') || 'm'
        session.user.volumeUnit = (token.volumeUnit as 'ml' | 'fl oz') || 'ml'
        session.user.weightGoal = token.weightGoal
        session.user.stepsGoal = token.stepsGoal
        session.user.waterGoal = token.waterGoal
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
