'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useTheme } from '@/components/ThemeProvider'
import { ArrowLeft, Check, Target } from 'lucide-react'

export default function GoalsPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const { accentColor } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  
  // Initialize from session
  const [stepsGoal, setStepsGoal] = useState<string>('')
  const [waterGoal, setWaterGoal] = useState<string>('')
  const [waterGoalUnit, setWaterGoalUnit] = useState<'ml' | 'fl oz'>('ml')
  const [weightGoal, setWeightGoal] = useState<string>('')
  const [weightGoalUnit, setWeightGoalUnit] = useState<'kg' | 'lb'>('kg')

  const accentColors = {
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    purple: '#a855f7',
  }

  const currentAccentValue = accentColors[accentColor]

  // Get user's unit preferences
  const weightUnit = (session?.user?.weightUnit as 'kg' | 'lb') || 'kg'
  const volumeUnit = (session?.user?.volumeUnit as 'ml' | 'fl oz') || 'ml'

  // Load values from session on mount
  useEffect(() => {
    if (session?.user) {
      // Steps goal - no conversion needed
      if (session.user.stepsGoal) {
        setStepsGoal(session.user.stepsGoal.toString())
      }

      // Weight goal - convert from kg to user's preferred unit for display
      if (session.user.weightGoal) {
        const weightInKg = session.user.weightGoal
        if (weightUnit === 'lb') {
          // Convert kg to lb: 1 kg = 2.20462 lb
          setWeightGoal((weightInKg * 2.20462).toFixed(1))
          setWeightGoalUnit('lb')
        } else {
          setWeightGoal(weightInKg.toFixed(1))
          setWeightGoalUnit('kg')
        }
      }

      // Water goal - convert from ml to user's preferred unit for display
      if (session.user.waterGoal) {
        const waterInMl = session.user.waterGoal
        if (volumeUnit === 'fl oz') {
          // Convert ml to fl oz: 1 ml = 0.033814 fl oz
          setWaterGoal((waterInMl * 0.033814).toFixed(1))
          setWaterGoalUnit('fl oz')
        } else {
          setWaterGoal(waterInMl.toFixed(0))
          setWaterGoalUnit('ml')
        }
      }

      // Set default units based on user preferences
      setWeightGoalUnit(weightUnit)
      setWaterGoalUnit(volumeUnit)
    }
  }, [session, weightUnit, volumeUnit])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: any = {}

      // Steps goal - no conversion needed
      if (stepsGoal) {
        payload.stepsGoal = parseInt(stepsGoal, 10)
      } else {
        payload.stepsGoal = null
      }

      // Weight goal - will be converted to kg in API
      if (weightGoal) {
        payload.weightGoal = parseFloat(weightGoal)
        payload.weightGoalUnit = weightGoalUnit
      } else {
        payload.weightGoal = null
      }

      // Water goal - will be converted to ml in API
      if (waterGoal) {
        payload.waterGoal = parseFloat(waterGoal)
        payload.waterGoalUnit = waterGoalUnit
      } else {
        payload.waterGoal = null
      }
      
      console.log('[CLIENT] Saving goals:', payload)
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[CLIENT] API error:', errorData)
        throw new Error(errorData.error || 'Failed to update goals')
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
      console.error('[CLIENT] Error saving goals:', error)
      alert('Failed to save goals. Please try again.')
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
            <Target size={20} className="text-[var(--text-secondary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Personal Goals</h1>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-4">
          {/* Daily Calorie Target (Weight Goal) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
              Daily Calorie Target
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={weightGoal}
                onChange={(e) => setWeightGoal(e.target.value)}
                placeholder="Enter weight goal"
                className="flex-1 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all"
                style={{
                  focusRingColor: currentAccentValue,
                }}
                min="0"
                step="0.1"
              />
              <select
                value={weightGoalUnit}
                onChange={(e) => setWeightGoalUnit(e.target.value as 'kg' | 'lb')}
                className="px-3 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all"
                style={{
                  focusRingColor: currentAccentValue,
                }}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>

          {/* Step Goal */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
              Step Goal
            </label>
            <div className="relative">
              <input
                type="number"
                value={stepsGoal}
                onChange={(e) => setStepsGoal(e.target.value)}
                placeholder="Enter step goal"
                className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all"
                style={{
                  focusRingColor: currentAccentValue,
                }}
                min="0"
                step="1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">
                steps
              </span>
            </div>
          </div>

          {/* Daily Water Intake */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
              Daily Water Intake
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={waterGoal}
                onChange={(e) => setWaterGoal(e.target.value)}
                placeholder="Enter water goal"
                className="flex-1 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all"
                style={{
                  focusRingColor: currentAccentValue,
                }}
                min="0"
                step="0.1"
              />
              <select
                value={waterGoalUnit}
                onChange={(e) => setWaterGoalUnit(e.target.value as 'ml' | 'fl oz')}
                className="px-3 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition-all"
                style={{
                  focusRingColor: currentAccentValue,
                }}
              >
                <option value="ml">ml</option>
                <option value="fl oz">fl oz</option>
              </select>
            </div>
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
