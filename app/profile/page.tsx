'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useTheme } from '@/components/ThemeProvider'
import { LogOut, Moon, Sun, Palette, ChevronDown } from 'lucide-react'

export default function ProfilePage() {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme()
  const [isAccentDropdownOpen, setIsAccentDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const accentColors = [
    { name: 'green', value: '#10b981', label: 'Green' },
    { name: 'blue', value: '#3b82f6', label: 'Blue' },
    { name: 'orange', value: '#f97316', label: 'Orange' },
    { name: 'purple', value: '#a855f7', label: 'Purple' },
  ] as const

  const currentAccent = accentColors.find(c => c.name === accentColor) || accentColors[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccentDropdownOpen(false)
      }
    }

    if (isAccentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccentDropdownOpen])

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/login' })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Profile</h1>

        {/* Theme Settings - One Line */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun size={20} className="text-[var(--text-secondary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Theme</h2>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'border-2'
                    : 'border border-[var(--border-color)]'
                }`}
                style={{
                  borderColor: theme === 'light' ? currentAccent.value : undefined,
                  backgroundColor: theme === 'light' ? `${currentAccent.value}10` : 'transparent',
                }}
              >
                <Sun size={18} className="text-[var(--text-primary)]" />
                <span className="text-[var(--text-primary)] font-medium">Light</span>
                {theme === 'light' && (
                  <div className="w-4 h-4 rounded-full ml-auto" style={{ backgroundColor: currentAccent.value }} />
                )}
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'border-2'
                    : 'border border-[var(--border-color)]'
                }`}
                style={{
                  borderColor: theme === 'dark' ? currentAccent.value : undefined,
                  backgroundColor: theme === 'dark' ? `${currentAccent.value}10` : 'transparent',
                }}
              >
                <Moon size={18} className="text-[var(--text-primary)]" />
                <span className="text-[var(--text-primary)] font-medium">Dark</span>
                {theme === 'dark' && (
                  <div className="w-4 h-4 rounded-full ml-auto" style={{ backgroundColor: currentAccent.value }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Accent Color Settings - Dropdown */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} className="text-[var(--text-secondary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Accent Color</h2>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAccentDropdownOpen(!isAccentDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] transition-all hover:bg-[var(--bg-primary)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: currentAccent.value }}
                />
                <span className="text-[var(--text-primary)] font-medium">{currentAccent.label}</span>
              </div>
              <ChevronDown 
                size={18} 
                className={`text-[var(--text-secondary)] transition-transform ${isAccentDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {isAccentDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-lg z-10 overflow-hidden">
                {accentColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setAccentColor(color.name as typeof accentColor)
                      setIsAccentDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 transition-all hover:bg-[var(--bg-primary)] ${
                      accentColor === color.name ? 'bg-[var(--bg-primary)]' : ''
                    }`}
                    style={{
                      backgroundColor: accentColor === color.name ? `${color.value}10` : undefined,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-[var(--text-primary)] font-medium">{color.label}</span>
                    {accentColor === color.name && (
                      <div className="ml-auto w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 font-medium transition-all hover:bg-red-500/20"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
      <BottomNavigation />
    </div>
  )
}
