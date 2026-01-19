'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useTheme } from '@/components/ThemeProvider'
import { ChevronDown, Ruler, ArrowLeft, Check } from 'lucide-react'

export default function UnitsPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const { accentColor } = useTheme()
  const [isWeightDropdownOpen, setIsWeightDropdownOpen] = useState(false)
  const [isLengthDropdownOpen, setIsLengthDropdownOpen] = useState(false)
  const [isVolumeDropdownOpen, setIsVolumeDropdownOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const weightDropdownRef = useRef<HTMLDivElement>(null)
  const lengthDropdownRef = useRef<HTMLDivElement>(null)
  const volumeDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize from session
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [lengthUnit, setLengthUnit] = useState<'m' | 'ft'>('m')
  const [volumeUnit, setVolumeUnit] = useState<'ml' | 'fl oz'>('ml')

  const accentColors = {
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    purple: '#a855f7',
  }

  const currentAccentValue = accentColors[accentColor]

  // Load values from session on mount
  useEffect(() => {
    if (session?.user) {
      if (session.user.weightUnit) setWeightUnit(session.user.weightUnit as 'kg' | 'lb')
      if (session.user.lengthUnit) setLengthUnit(session.user.lengthUnit as 'm' | 'ft')
      if (session.user.volumeUnit) setVolumeUnit(session.user.volumeUnit as 'ml' | 'fl oz')
    }
  }, [session])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (weightDropdownRef.current && !weightDropdownRef.current.contains(event.target as Node)) {
        setIsWeightDropdownOpen(false)
      }
      if (lengthDropdownRef.current && !lengthDropdownRef.current.contains(event.target as Node)) {
        setIsLengthDropdownOpen(false)
      }
      if (volumeDropdownRef.current && !volumeDropdownRef.current.contains(event.target as Node)) {
        setIsVolumeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        weightUnit,
        lengthUnit,
        volumeUnit,
      }
      
      console.log('[CLIENT] Saving units:', payload)
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[CLIENT] API error:', errorData)
        throw new Error(errorData.error || 'Failed to update preferences')
      }

      const result = await response.json()
      console.log('[CLIENT] API response:', result)

      // Refresh session to get updated values
      await updateSession()
      
      // Small delay to ensure session is refreshed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Redirect back to profile
      router.push('/profile')
      router.refresh() // Force refresh to get updated data
    } catch (error) {
      console.error('[CLIENT] Error saving units:', error)
      alert('Failed to save units. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--text-primary)]" />
          </button>
          <div className="flex items-center gap-2">
            <Ruler size={20} className="text-[var(--text-secondary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Units & Conventions</h1>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-4">
          {/* Weight Unit */}
          <div className="relative" ref={weightDropdownRef}>
            <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Weight</label>
            <button
              onClick={() => setIsWeightDropdownOpen(!isWeightDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] transition-all hover:bg-[var(--bg-primary)]"
            >
              <span className="text-[var(--text-primary)] font-medium">
                {weightUnit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[var(--text-secondary)] transition-transform ${isWeightDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {isWeightDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setWeightUnit('kg')
                    setIsWeightDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                    weightUnit === 'kg' ? 'bg-[var(--bg-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: weightUnit === 'kg' ? `${currentAccentValue}10` : undefined,
                  }}
                >
                  <span className="text-[var(--text-primary)] font-medium">Kilograms (kg)</span>
                  {weightUnit === 'kg' && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentAccentValue }} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setWeightUnit('lb')
                    setIsWeightDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                    weightUnit === 'lb' ? 'bg-[var(--bg-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: weightUnit === 'lb' ? `${currentAccentValue}10` : undefined,
                  }}
                >
                  <span className="text-[var(--text-primary)] font-medium">Pounds (lb)</span>
                  {weightUnit === 'lb' && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentAccentValue }} />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Length Unit */}
          <div className="relative" ref={lengthDropdownRef}>
            <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Length</label>
            <button
              onClick={() => setIsLengthDropdownOpen(!isLengthDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] transition-all hover:bg-[var(--bg-primary)]"
            >
              <span className="text-[var(--text-primary)] font-medium">
                {lengthUnit === 'm' ? 'Meters (m)' : 'Feet (ft)'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[var(--text-secondary)] transition-transform ${isLengthDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {isLengthDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setLengthUnit('m')
                    setIsLengthDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                    lengthUnit === 'm' ? 'bg-[var(--bg-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: lengthUnit === 'm' ? `${currentAccentValue}10` : undefined,
                  }}
                >
                  <span className="text-[var(--text-primary)] font-medium">Meters (m)</span>
                  {lengthUnit === 'm' && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentAccentValue }} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setLengthUnit('ft')
                    setIsLengthDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                    lengthUnit === 'ft' ? 'bg-[var(--bg-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: lengthUnit === 'ft' ? `${currentAccentValue}10` : undefined,
                  }}
                >
                  <span className="text-[var(--text-primary)] font-medium">Feet (ft)</span>
                  {lengthUnit === 'ft' && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentAccentValue }} />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Volume Unit */}
          <div className="relative" ref={volumeDropdownRef}>
            <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Volume</label>
            <button
              onClick={() => setIsVolumeDropdownOpen(!isVolumeDropdownOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] transition-all hover:bg-[var(--bg-primary)]"
            >
              <span className="text-[var(--text-primary)] font-medium">
                {volumeUnit === 'ml' ? 'Milliliters (ml)' : 'Fluid Ounces (fl oz)'}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-[var(--text-secondary)] transition-transform ${isVolumeDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {isVolumeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setVolumeUnit('ml')
                    setIsVolumeDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                    volumeUnit === 'ml' ? 'bg-[var(--bg-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: volumeUnit === 'ml' ? `${currentAccentValue}10` : undefined,
                  }}
                >
                  <span className="text-[var(--text-primary)] font-medium">Milliliters (ml)</span>
                  {volumeUnit === 'ml' && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentAccentValue }} />
                  )}
                </button>
                <button
                  onClick={() => {
                    setVolumeUnit('fl oz')
                    setIsVolumeDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                    volumeUnit === 'fl oz' ? 'bg-[var(--bg-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: volumeUnit === 'fl oz' ? `${currentAccentValue}10` : undefined,
                  }}
                >
                  <span className="text-[var(--text-primary)] font-medium">Fluid Ounces (fl oz)</span>
                  {volumeUnit === 'fl oz' && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentAccentValue }} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isSaving ? `${currentAccentValue}80` : currentAccentValue,
          }}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={18} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
      <BottomNavigation />
    </div>
  )
}
