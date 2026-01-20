'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useTheme } from '@/components/ThemeProvider'
import { LogOut, Moon, Sun, Palette, ChevronDown, Ruler, Edit, Target } from 'lucide-react'

export default function ProfilePage() {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme()
  const { data: session } = useSession()
  const router = useRouter()
  const [isAccentDropdownOpen, setIsAccentDropdownOpen] = useState(false)
  
  const accentDropdownRef = useRef<HTMLDivElement>(null)

  // Get unit values from session
  const weightUnit = (session?.user?.weightUnit as 'kg' | 'lb') || 'kg'
  const lengthUnit = (session?.user?.lengthUnit as 'm' | 'ft') || 'm'
  const volumeUnit = (session?.user?.volumeUnit as 'ml' | 'fl oz') || 'ml'

  const getUnitLabel = (type: 'weight' | 'length' | 'volume') => {
    if (type === 'weight') {
      return weightUnit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'
    }
    if (type === 'length') {
      return lengthUnit === 'm' ? 'Meters (m)' : 'Feet (ft)'
    }
    return volumeUnit === 'ml' ? 'Milliliters (ml)' : 'Fluid Ounces (fl oz)'
  }

  // Format goals with unit conversion for display
  const formatWeightGoal = () => {
    const weightGoal = session?.user?.weightGoal
    if (!weightGoal) return 'Not set'
    if (weightUnit === 'lb') {
      // Convert kg to lb: 1 kg = 2.20462 lb
      return `${(weightGoal * 2.20462).toFixed(1)} lb`
    }
    return `${weightGoal.toFixed(1)} kg`
  }

  const formatWaterGoal = () => {
    const waterGoal = session?.user?.waterGoal
    if (!waterGoal) return 'Not set'
    if (volumeUnit === 'fl oz') {
      // Convert ml to fl oz: 1 ml = 0.033814 fl oz
      return `${(waterGoal * 0.033814).toFixed(1)} fl oz`
    }
    return `${Math.round(waterGoal)} ml`
  }

  const formatStepsGoal = () => {
    const stepsGoal = session?.user?.stepsGoal
    if (!stepsGoal) return 'Not set'
    return `${stepsGoal.toLocaleString()} steps`
  }

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
      if (accentDropdownRef.current && !accentDropdownRef.current.contains(event.target as Node)) {
        setIsAccentDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

        {/* Personal Goals */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-[var(--text-secondary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Personal Goals</h2>
            </div>
            <button
              onClick={() => router.push('/profile/goals')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all"
              style={{
                borderColor: currentAccent.value,
                color: currentAccent.value,
              }}
            >
              <Edit size={16} />
              <span className="text-sm font-medium">Edit</span>
            </button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Daily Calorie Target</label>
              <p className="text-[var(--text-primary)] font-medium">
                {session?.user?.weightGoal ? formatWeightGoal() : 'Not set'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Step Goal</label>
              <p className="text-[var(--text-primary)] font-medium">{formatStepsGoal()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Daily Water Intake</label>
              <p className="text-[var(--text-primary)] font-medium">{formatWaterGoal()}</p>
            </div>
          </div>
        </div>

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
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 relative" ref={accentDropdownRef}>
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

        {/* Units & Conventions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ruler size={20} className="text-[var(--text-secondary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Units & Conventions</h2>
            </div>
            <button
              onClick={() => router.push('/profile/units')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all"
              style={{
                borderColor: currentAccent.value,
                color: currentAccent.value,
              }}
            >
              <Edit size={16} />
              <span className="text-sm font-medium">Edit</span>
            </button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Weight</label>
              <p className="text-[var(--text-primary)] font-medium">{getUnitLabel('weight')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Length</label>
              <p className="text-[var(--text-primary)] font-medium">{getUnitLabel('length')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Volume</label>
              <p className="text-[var(--text-primary)] font-medium">{getUnitLabel('volume')}</p>
            </div>
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
