'use client'

import { useSession } from 'next-auth/react'

export function useUnits() {
  const { data: session } = useSession()

  return {
    weightUnit: (session?.user?.weightUnit as 'kg' | 'lb') || 'kg',
    lengthUnit: (session?.user?.lengthUnit as 'm' | 'ft') || 'm',
    volumeUnit: (session?.user?.volumeUnit as 'ml' | 'fl oz') || 'ml',
  }
}
