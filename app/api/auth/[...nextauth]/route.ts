import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

async function loadUserPreferences(userId: string) {
  try {
    await connectDB()
    const user = await User.findById(userId).select('theme accentColor')
    return {
      theme: (user?.theme as 'light' | 'dark') || 'dark',
      accentColor: (user?.accentColor as 'green' | 'blue' | 'orange' | 'purple') || 'green',
    }
  } catch (error) {
    console.error('Error loading user preferences:', error)
    return {
      theme: 'dark' as const,
      accentColor: 'green' as const,
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
      }
      
      // Refresh preferences when session is updated
      if (trigger === 'update' && token.id) {
        const preferences = await loadUserPreferences(token.id as string)
        token.theme = preferences.theme
        token.accentColor = preferences.accentColor
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.theme = (token.theme as 'light' | 'dark') || 'dark'
        session.user.accentColor = (token.accentColor as 'green' | 'blue' | 'orange' | 'purple') || 'green'
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
