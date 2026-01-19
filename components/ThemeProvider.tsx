'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

type Theme = 'light' | 'dark'
type AccentColor = 'green' | 'blue' | 'orange' | 'purple'

interface ThemeContextType {
  theme: Theme
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const accentColors = {
  green: '#10b981',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#a855f7',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: session, update: updateSession } = useSession()
  const [theme, setThemeState] = useState<Theme>('dark')
  const [accentColor, setAccentColorState] = useState<AccentColor>('green')
  const [mounted, setMounted] = useState(false)

  // Load theme from session (user preferences from DB) or defaults
  useEffect(() => {
    if (session?.user) {
      const userTheme = (session.user.theme as Theme) || 'dark'
      const userAccentColor = (session.user.accentColor as AccentColor) || 'green'
      setThemeState(userTheme)
      setAccentColorState(userAccentColor)
      
      // Apply immediately
      const root = document.documentElement
      root.setAttribute('data-theme', userTheme)
      root.style.setProperty('--accent-color', accentColors[userAccentColor])
    } else {
      // Not logged in, use defaults
      const root = document.documentElement
      root.setAttribute('data-theme', 'dark')
      root.style.setProperty('--accent-color', accentColors.green)
    }
    setMounted(true)
  }, [session])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.style.setProperty('--accent-color', accentColors[accentColor])
  }, [theme, accentColor, mounted])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    
    // Update in database if user is logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        })
        // Refresh session to get updated preferences
        await updateSession()
      } catch (error) {
        console.error('Error updating theme:', error)
      }
    }
  }

  const setAccentColor = async (color: AccentColor) => {
    setAccentColorState(color)
    
    // Update in database if user is logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accentColor: color }),
        })
        // Refresh session to get updated preferences
        await updateSession()
      } catch (error) {
        console.error('Error updating accent color:', error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
