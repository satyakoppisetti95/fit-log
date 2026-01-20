import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      theme?: 'light' | 'dark'
      accentColor?: 'green' | 'blue' | 'orange' | 'purple'
      weightUnit?: 'kg' | 'lb'
      lengthUnit?: 'm' | 'ft'
      volumeUnit?: 'ml' | 'fl oz'
      weightGoal?: number
      stepsGoal?: number
      waterGoal?: number
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name?: string | null
    theme?: 'light' | 'dark'
    accentColor?: 'green' | 'blue' | 'orange' | 'purple'
    weightUnit?: 'kg' | 'lb'
    lengthUnit?: 'm' | 'ft'
    volumeUnit?: 'ml' | 'fl oz'
    weightGoal?: number
    stepsGoal?: number
    waterGoal?: number
  }
}
