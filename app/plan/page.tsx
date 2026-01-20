'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { useSession } from 'next-auth/react'
import { Activity, Dumbbell, Utensils, ChevronDown, Armchair, User, Zap, TrendingDown, Scale, Info, Leaf, Heart, Check } from 'lucide-react'

interface PlanData {
  age?: number
  sex?: 'male' | 'female'
  height?: number
  weight?: number
  activityLevel?: string
  goal?: string
  goalOptions?: {
    pace?: string
    focus?: string
    trainingExperience?: string
    strengthTrainingDays?: string
    fatGainTolerance?: string
    workoutFrequency?: string
    dietExperience?: string
  }
  dietaryPreferences?: string[]
  [key: string]: any
}

export default function PlanPage() {
  const router = useRouter()
  const { theme, accentColor } = useTheme()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [planData, setPlanData] = useState<PlanData>({})
  
  // Get user's preferred units from session or use defaults
  const weightUnit = (session?.user?.weightUnit as 'kg' | 'lb') || 'kg'
  const lengthUnit = (session?.user?.lengthUnit as 'm' | 'ft') || 'm'
  
  // Local state for Step 2 inputs (in user's preferred units)
  const [heightInput, setHeightInput] = useState<string>('')
  const [weightInput, setWeightInput] = useState<string>('')
  // Default to 'cm' for height, or 'ft' if user prefers feet
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>(lengthUnit === 'ft' ? 'ft' : 'cm')
  const [weightUnitLocal, setWeightUnitLocal] = useState<'kg' | 'lb'>(weightUnit)
  const [isHeightDropdownOpen, setIsHeightDropdownOpen] = useState(false)
  const [isWeightDropdownOpen, setIsWeightDropdownOpen] = useState(false)
  
  const heightDropdownRef = useRef<HTMLDivElement>(null)
  const weightDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize units from session when component mounts or session changes
  useEffect(() => {
    if (session?.user) {
      // For height, use 'cm' if user prefers meters, or 'ft' if they prefer feet
      if (session.user.lengthUnit) {
        setHeightUnit(session.user.lengthUnit === 'ft' ? 'ft' : 'cm')
      }
      if (session.user.weightUnit) setWeightUnitLocal(session.user.weightUnit as 'kg' | 'lb')
    }
  }, [session])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (heightDropdownRef.current && !heightDropdownRef.current.contains(event.target as Node)) {
        setIsHeightDropdownOpen(false)
      }
      if (weightDropdownRef.current && !weightDropdownRef.current.contains(event.target as Node)) {
        setIsWeightDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const totalSteps = 7

  const accentColorValue = {
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    purple: '#a855f7',
  }[accentColor]

  const updatePlanData = (field: string, value: any) => {
    setPlanData(prev => ({ ...prev, [field]: value }))
  }

  const updateGoalOptions = (field: string, value: any) => {
    setPlanData(prev => ({
      ...prev,
      goalOptions: {
        ...prev.goalOptions,
        [field]: value,
      },
    }))
  }

  // Convert height to meters
  const convertHeightToMeters = (value: number, unit: 'cm' | 'ft'): number => {
    if (unit === 'ft') {
      // Convert feet to meters: 1 ft = 0.3048 m
      return value * 0.3048
    }
    // Convert centimeters to meters: 1 cm = 0.01 m
    return value * 0.01
  }

  // Convert weight to kg
  const convertWeightToKg = (value: number, unit: 'kg' | 'lb'): number => {
    if (unit === 'lb') {
      // Convert lb to kg: 1 lb = 0.453592 kg
      return value * 0.453592
    }
    return value
  }

  // Calculate nutrition plan
  const calculateNutritionPlan = (input: any) => {
    const {
      age,
      sex,
      height, // meters
      weight, // kg
      activityLevel,
      goal,
      goalOptions = {}
    } = input;

    const {
      workoutFrequency, // "0-1" | "2-3" | "4-6"
      dietExperience    // "beginner" | "intermediate" | "advanced"
    } = goalOptions;

    /* ------------------ Config ------------------ */

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      "lightly-active": 1.375,
      moderate: 1.55,
      "very-active": 1.725,
      athlete: 1.9
    };

    const SAFE_MIN_CALORIES = sex === "male" ? 1500 : 1200;

    const PROTEIN_RANGES: Record<string, { min: number; max: number }> = {
      lose_weight: { min: 1.6, max: 2.2 },   // g/kg
      maintain_health: { min: 1.2, max: 1.6 },
      build_muscle: { min: 1.6, max: 2.0 }
    };

    const FAT_BOUNDS = {
      minFraction: 0.20,
      maxFraction: 0.35
    };

    /* ------------------ Helpers ------------------ */

    function experienceFactor(type: string): number {
      // Returns a multiplier for how aggressive to be
      // beginners → more conservative, advanced → slightly more aggressive
      if (dietExperience === "beginner") return type === "deficit" ? 0.7 : 0.8;
      if (dietExperience === "advanced") return type === "deficit" ? 1.1 : 1.1;
      return 1.0; // intermediate
    }

    function frequencyFactor(type: string): number {
      // Fewer workout days → smaller deficit/surplus
      if (workoutFrequency === "0-1") return type === "deficit" ? 0.7 : 0.7;
      if (workoutFrequency === "2-3") return 1.0;
      if (workoutFrequency === "4-6") return type === "deficit" ? 1.0 : 1.1;
      return 1.0;
    }

    function applyAggression(base: number, type: string): number {
      const ef = experienceFactor(type);
      const ff = frequencyFactor(type);
      return base * ef * ff;
    }

    /* ------------------ 1. BMR ------------------ */

    const heightCm = height * 100;

    const bmr =
      sex === "male"
        ? 10 * weight + 6.25 * heightCm - 5 * age + 5
        : 10 * weight + 6.25 * heightCm - 5 * age - 161;

    /* ------------------ 2. TDEE ------------------ */

    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));

    /* ------------------ 3. Goal Logic ------------------ */

    let calorieAdjustment = 0;
    const notes: string[] = [];

    let proteinPerKg: number | undefined;
    let fatFraction = 0.25;
    let carbFraction: number;

    /* ===== LOSE WEIGHT ===== */
    if (goal === "lose_weight") {
      const { pace } = goalOptions;

      const basePaceDeficit: Record<string, number> = {
        slow: -250,
        moderate: -500,
        fast: -750,  // Map 'fast' to 'aggressive' equivalent
        aggressive: -750
      };

      let baseDeficit = basePaceDeficit[pace] ?? -500;

      // Adjust by experience and workout frequency
      let adjustedDeficit = applyAggression(baseDeficit, "deficit");

      // Cap deficit to stay within common safe range
      if (adjustedDeficit < -750) adjustedDeficit = -750;
      if (adjustedDeficit > -250) adjustedDeficit = -250;

      calorieAdjustment = adjustedDeficit;

      const range = PROTEIN_RANGES.lose_weight;
      proteinPerKg = (range.min + range.max) / 2;

      fatFraction = 0.25;

      notes.push("Fat loss focused calorie deficit");
      notes.push(
        `Deficit scaled for experience (${dietExperience || 'intermediate'}) and workout frequency (${workoutFrequency || '2-3'} days/week)`
      );
    }

    /* ===== MAINTAIN HEALTH ===== */
    if (goal === "maintain_health") {
      const { focus = "general_health" } = goalOptions;

      calorieAdjustment = 0;

      const range = PROTEIN_RANGES.maintain_health;
      proteinPerKg = (range.min + range.max) / 2;

      fatFraction = 0.30;

      notes.push("Calories set to maintenance level");
      notes.push(`Focus: ${focus.replace("_", " ")}`);
    }

    /* ===== BUILD MUSCLE ===== */
    if (goal === "build_muscle") {
      const { trainingExperience, fatGainTolerance } = goalOptions;

      const baseSurplusByExperience: Record<string, number> = {
        beginner: 300,
        intermediate: 250,
        advanced: 200
      };

      let baseSurplus = baseSurplusByExperience[trainingExperience] ?? 250;

      // Modify surplus by experience + workout frequency
      let adjustedSurplus = applyAggression(baseSurplus, "surplus");

      if (fatGainTolerance === "minimal") {
        adjustedSurplus -= 50;
        notes.push("Minimal fat gain preference — surplus reduced");
      }

      // Cap surplus
      if (adjustedSurplus > 400) adjustedSurplus = 400;
      if (adjustedSurplus < 150) adjustedSurplus = 150;

      calorieAdjustment = adjustedSurplus;

      const range = PROTEIN_RANGES.build_muscle;
      proteinPerKg = (range.min + range.max) / 2;

      fatFraction = 0.25;

      notes.push("Lean muscle gain focused calorie surplus");
      notes.push(
        `Surplus scaled for experience (${dietExperience || 'intermediate'}) and workout frequency (${workoutFrequency || '2-3'} days/week)`
      );
    }

    /* ------------------ 4. Target Calories ------------------ */

    let targetCalories = Math.round(tdee + calorieAdjustment);

    if (targetCalories < SAFE_MIN_CALORIES) {
      targetCalories = SAFE_MIN_CALORIES;
      notes.push("Calories adjusted to safe minimum");
    }

    /* ------------------ 5. Macros ------------------ */

    if (!proteinPerKg) {
      const range = PROTEIN_RANGES.maintain_health;
      proteinPerKg = (range.min + range.max) / 2;
      notes.push("Default protein range applied");
    }

    const proteinGrams = Math.round(proteinPerKg * weight);
    const proteinCalories = proteinGrams * 4;

    if (fatFraction < FAT_BOUNDS.minFraction) fatFraction = FAT_BOUNDS.minFraction;
    if (fatFraction > FAT_BOUNDS.maxFraction) fatFraction = FAT_BOUNDS.maxFraction;

    let fatCalories = targetCalories * fatFraction;
    let fatGrams = Math.round(fatCalories / 9);

    let remainingCalories = targetCalories - proteinCalories - fatCalories;
    let carbCalories = remainingCalories;

    if (remainingCalories < 0) {
      const adjustedFatCalories = Math.max(
        targetCalories * FAT_BOUNDS.minFraction,
        targetCalories - proteinCalories - 0.4 * targetCalories
      );
      const adjustedFatGrams = Math.round(adjustedFatCalories / 9);
      const adjustedRemaining = targetCalories - proteinCalories - adjustedFatCalories;
      carbCalories = Math.max(adjustedRemaining, 0);
      notes.push("Fat intake adjusted to fit calorie and protein targets");
      fatCalories = adjustedFatCalories;
      fatGrams = adjustedFatGrams;
    }

    const carbGrams = Math.round(carbCalories / 4);

    const proteinPercent = (proteinCalories / targetCalories) * 100;
    const fatPercent = (fatCalories / targetCalories) * 100;
    const carbPercent = (carbCalories / targetCalories) * 100;

    const macros = {
      protein: {
        grams: proteinGrams,
        calories: Math.round(proteinCalories),
        percentage: proteinPercent
      },
      carbs: {
        grams: carbGrams,
        calories: Math.round(carbCalories),
        percentage: carbPercent
      },
      fats: {
        grams: fatGrams,
        calories: Math.round(fatCalories),
        percentage: fatPercent
      }
    };

    const weeklyAdjustment = calorieAdjustment * 7;
    const expectedKgPerWeek =
      Math.round((weeklyAdjustment / 7700) * 100) / 100;

    if (calorieAdjustment !== 0) {
      notes.push(
        `Approximate change: ${expectedKgPerWeek} kg/week (estimate, actual will vary)`
      );
    }

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      calorieAdjustment,
      macros,
      expectedKgPerWeek,
      notes
    };
  }

  // Handle Step 2 next button - convert to metric and save
  const handleStep2Next = () => {
    const heightValue = parseFloat(heightInput)
    const weightValue = parseFloat(weightInput)
    
    if (heightValue && weightValue) {
      // Convert to metric units and save
      updatePlanData('height', convertHeightToMeters(heightValue, heightUnit))
      updatePlanData('weight', convertWeightToKg(weightValue, weightUnitLocal))
      handleNext()
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Final step - output JSON
      console.log('Final Plan Data:', JSON.stringify(planData, null, 2))
      // You can add navigation or API call here
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const progress = currentStep === 0 ? 0 : (currentStep / totalSteps) * 100

  // Get Started Screen (Step 0)
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <div className="flex items-center gap-2">
              <h1 
                className="text-xl font-bold"
                style={{ color: accentColorValue }}
              >
                Fit Log
              </h1>
            </div>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step 0 of {totalSteps}
            </div>
          </div>

          {/* Illustration Area */}
          <div className="px-6 mb-6">
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 min-h-[200px] flex items-center justify-center border border-[var(--border-color)]">
              <div className="text-[var(--text-secondary)] text-sm opacity-50">
                <div className="text-center">Illustration Placeholder</div>
                <div className="text-xs mt-2 text-center">MANDARIINTERG DURA WORK</div>
                <div className="text-xs text-center">OILOSTO POAIDIO TOGODIA</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 mb-8 flex-1">
            <h2 className="text-3xl font-bold text-center mb-4 text-[var(--text-primary)]">
              Let's calculate your daily nutrition needs
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-8">
              Answer a few questions to get a personalized plan tailored to your body and fitness goals.
            </p>

            {/* Feature Icons */}
            <div className="flex justify-around mb-8">
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: accentColorValue }}
                >
                  <Activity size={24} className="text-white" />
                </div>
                <span className="text-xs uppercase text-[var(--text-primary)]">Metabolism</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: accentColorValue }}
                >
                  <Dumbbell size={24} className="text-white" />
                </div>
                <span className="text-xs uppercase text-[var(--text-primary)]">Weight Control</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: accentColorValue }}
                >
                  <Utensils size={24} className="text-white" />
                </div>
                <span className="text-xs uppercase text-[var(--text-primary)]">Macros</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleNext}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Get Started
              <span>→</span>
            </button>
            <p className="text-xs text-[var(--text-secondary)] text-center mt-4">
              By continuing, you agree to our{' '}
              <span className="underline">Terms of Service</span> and{' '}
              <span className="underline">Privacy Policy</span>.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-6">
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 1: Age and Sex
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1">
            {/* Age Input */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">How old are you?</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                This helps us calculate your BMR and metabolic profile.
              </p>
              <div className="relative">
                <input
                  type="number"
                  value={planData.age || ''}
                  onChange={(e) => updatePlanData('age', parseInt(e.target.value))}
                  placeholder="Enter age"
                  className="w-full px-4 py-4 rounded-xl bg-[var(--bg-secondary)] border-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: accentColorValue,
                    '--tw-ring-color': accentColorValue,
                  } as React.CSSProperties}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-primary)]">📅</span>
              </div>
            </div>

            {/* Sex Selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">What is your sex?</h2>
              <div className="flex gap-6">
                <button
                  onClick={() => updatePlanData('sex', 'male')}
                  className={`flex-1 flex flex-col items-center p-6 rounded-2xl transition-all border-2 ${
                    planData.sex === 'male'
                      ? ''
                      : 'bg-transparent border-[var(--border-color)]'
                  }`}
                  style={
                    planData.sex === 'male'
                      ? {
                          backgroundColor: accentColorValue,
                          borderColor: accentColorValue,
                        }
                      : {}
                  }
                >
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      planData.sex === 'male' ? 'bg-white' : 'bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <span 
                      className={`text-2xl ${
                        planData.sex === 'male' ? 'text-black' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      ♂
                    </span>
                  </div>
                  <span 
                    className={planData.sex === 'male' ? 'text-white font-semibold' : 'text-[var(--text-secondary)]'}
                  >
                    Male
                  </span>
                </button>
                <button
                  onClick={() => updatePlanData('sex', 'female')}
                  className={`flex-1 flex flex-col items-center p-6 rounded-2xl transition-all border-2 ${
                    planData.sex === 'female'
                      ? ''
                      : 'bg-transparent border-[var(--border-color)]'
                  }`}
                  style={
                    planData.sex === 'female'
                      ? {
                          backgroundColor: accentColorValue,
                          borderColor: accentColorValue,
                        }
                      : {}
                  }
                >
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      planData.sex === 'female' ? 'bg-white' : 'bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <span 
                      className={`text-2xl ${
                        planData.sex === 'female' ? 'text-black' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      ♀
                    </span>
                  </div>
                  <span 
                    className={planData.sex === 'female' ? 'text-white font-semibold' : 'text-[var(--text-secondary)]'}
                  >
                    Female
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleNext}
              disabled={!planData.age || !planData.sex}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
              }}
            >
              Next
              <span>→</span>
            </button>
            <p className="text-xs text-[var(--text-secondary)] text-center mt-4">
              We use this information to personalize your daily targets.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Height and Weight
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1">
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
              What are your measurements?
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              We use these metrics to accurately estimate your Basal Metabolic Rate (BMR), which is the foundation for your personalized calorie target.
            </p>

            {/* Height Input */}
            <div className="mb-6 relative" ref={heightDropdownRef}>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  placeholder={`Enter height in ${heightUnit === 'cm' ? 'centimeters' : 'feet'}`}
                  className="flex-1 px-4 py-4 rounded-xl bg-[var(--bg-secondary)] border-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: accentColorValue,
                    '--tw-ring-color': accentColorValue,
                  } as React.CSSProperties}
                />
                <div className="relative">
                  <button
                    onClick={() => setIsHeightDropdownOpen(!isHeightDropdownOpen)}
                    className="px-4 py-4 rounded-xl bg-[var(--bg-secondary)] border-2 text-[var(--text-primary)] font-medium flex items-center gap-2 transition-all hover:bg-[var(--bg-primary)]"
                    style={{
                      borderColor: accentColorValue,
                    }}
                  >
                    {heightUnit === 'cm' ? 'cm' : 'ft'}
                    <ChevronDown 
                      size={18} 
                      className={`text-[var(--text-secondary)] transition-transform ${isHeightDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isHeightDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-lg z-10 overflow-hidden min-w-[180px]">
                      <button
                        onClick={() => {
                          setHeightUnit('cm')
                          setIsHeightDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                          heightUnit === 'cm' ? 'bg-[var(--bg-primary)]' : ''
                        }`}
                        style={{
                          backgroundColor: heightUnit === 'cm' ? `${accentColorValue}10` : undefined,
                        }}
                      >
                        <span className="text-[var(--text-primary)] font-medium">Centimeters (cm)</span>
                        {heightUnit === 'cm' && (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColorValue }} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setHeightUnit('ft')
                          setIsHeightDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                          heightUnit === 'ft' ? 'bg-[var(--bg-primary)]' : ''
                        }`}
                        style={{
                          backgroundColor: heightUnit === 'ft' ? `${accentColorValue}10` : undefined,
                        }}
                      >
                        <span className="text-[var(--text-primary)] font-medium">Feet (ft)</span>
                        {heightUnit === 'ft' && (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColorValue }} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weight Input */}
            <div className="mb-6 relative" ref={weightDropdownRef}>
              <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={`Enter weight in ${weightUnitLocal === 'kg' ? 'kilograms' : 'pounds'}`}
                  className="flex-1 px-4 py-4 rounded-xl bg-[var(--bg-secondary)] border-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: accentColorValue,
                    '--tw-ring-color': accentColorValue,
                  } as React.CSSProperties}
                />
                <div className="relative">
                  <button
                    onClick={() => setIsWeightDropdownOpen(!isWeightDropdownOpen)}
                    className="px-4 py-4 rounded-xl bg-[var(--bg-secondary)] border-2 text-[var(--text-primary)] font-medium flex items-center gap-2 transition-all hover:bg-[var(--bg-primary)]"
                    style={{
                      borderColor: accentColorValue,
                    }}
                  >
                    {weightUnitLocal === 'kg' ? 'kg' : 'lb'}
                    <ChevronDown 
                      size={18} 
                      className={`text-[var(--text-secondary)] transition-transform ${isWeightDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isWeightDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-lg z-10 overflow-hidden min-w-[150px]">
                      <button
                        onClick={() => {
                          setWeightUnitLocal('kg')
                          setIsWeightDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                          weightUnitLocal === 'kg' ? 'bg-[var(--bg-primary)]' : ''
                        }`}
                        style={{
                          backgroundColor: weightUnitLocal === 'kg' ? `${accentColorValue}10` : undefined,
                        }}
                      >
                        <span className="text-[var(--text-primary)] font-medium">Kilograms (kg)</span>
                        {weightUnitLocal === 'kg' && (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColorValue }} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setWeightUnitLocal('lb')
                          setIsWeightDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between p-3 transition-all hover:bg-[var(--bg-primary)] ${
                          weightUnitLocal === 'lb' ? 'bg-[var(--bg-primary)]' : ''
                        }`}
                        style={{
                          backgroundColor: weightUnitLocal === 'lb' ? `${accentColorValue}10` : undefined,
                        }}
                      >
                        <span className="text-[var(--text-primary)] font-medium">Pounds (lb)</span>
                        {weightUnitLocal === 'lb' && (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColorValue }} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleStep2Next}
              disabled={!heightInput || !weightInput || !parseFloat(heightInput) || !parseFloat(weightInput)}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
              }}
            >
              Next
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Activity Level
  if (currentStep === 3) {
    const activityLevels = [
      {
        id: 'sedentary',
        title: 'Sedentary',
        description: 'Little to no exercise; desk job',
        icon: Armchair,
      },
      {
        id: 'lightly-active',
        title: 'Lightly Active',
        description: 'Light exercise 1-3 days/week',
        icon: User,
      },
      {
        id: 'moderately-active',
        title: 'Moderately Active',
        description: 'Moderate exercise 3-5 days/week',
        icon: Dumbbell,
      },
      {
        id: 'very-active',
        title: 'Very Active',
        description: 'Hard exercise 6-7 days/week',
        icon: Activity,
      },
      {
        id: 'extra-active',
        title: 'Extra Active',
        description: 'Physical job or training 2x/day',
        icon: Zap,
      },
    ]

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1">
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
              What's your activity level?
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              This helps us calculate your daily calorie burn more accurately.
            </p>

            {/* Activity Level Options */}
            <div className="space-y-3">
              {activityLevels.map((level) => {
                const IconComponent = level.icon
                const isSelected = planData.activityLevel === level.id
                
                return (
                  <button
                    key={level.id}
                    onClick={() => updatePlanData('activityLevel', level.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? ''
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${accentColorValue}10`,
                            borderColor: accentColorValue,
                          }
                        : {}
                    }
                  >
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? accentColorValue : 'var(--bg-primary)',
                      }}
                    >
                      <IconComponent 
                        size={24} 
                        className={isSelected ? 'text-white' : 'text-[var(--text-primary)]'}
                      />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                        {level.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {level.description}
                      </p>
                    </div>

                    {/* Radio Button */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? '' : 'border-[var(--border-color)]'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: accentColorValue,
                                backgroundColor: accentColorValue,
                              }
                            : {}
                        }
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleNext}
              disabled={!planData.activityLevel}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
              }}
            >
              Next
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Primary Goal
  if (currentStep === 4) {
    const goals = [
      {
        id: 'lose-weight',
        title: 'Lose Weight',
        description: 'Burn fat and get leaner',
        icon: TrendingDown,
      },
      {
        id: 'maintain-health',
        title: 'Maintain Health',
        description: 'Keep your current weight and optimize vitals',
        icon: Scale,
      },
      {
        id: 'build-muscle',
        title: 'Build Muscle',
        description: 'Gain strength and increase mass',
        icon: Dumbbell,
      },
    ]

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1">
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
              What is your primary goal?
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              This helps us personalize your daily calorie and nutrient targets.
            </p>

            {/* Goal Options */}
            <div className="space-y-3">
              {goals.map((goal) => {
                const IconComponent = goal.icon
                const isSelected = planData.goal === goal.id
                
                return (
                  <button
                    key={goal.id}
                    onClick={() => updatePlanData('goal', goal.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? ''
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${accentColorValue}10`,
                            borderColor: accentColorValue,
                          }
                        : {}
                    }
                  >
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? accentColorValue : 'var(--bg-primary)',
                      }}
                    >
                      <IconComponent 
                        size={24} 
                        className={isSelected ? 'text-white' : 'text-[var(--text-primary)]'}
                      />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                        {goal.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {goal.description}
                      </p>
                    </div>

                    {/* Radio Button */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? '' : 'border-[var(--border-color)]'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: accentColorValue,
                                backgroundColor: accentColorValue,
                              }
                            : {}
                        }
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleNext}
              disabled={!planData.goal}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
              }}
            >
              Next
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 5: Conditional based on goal
  if (currentStep === 5) {
    // Lose Weight: Show pace selection
    if (planData.goal === 'lose-weight') {
      const paces = [
      {
        id: 'slow',
        title: 'Slow',
        category: 'STEADY & SUSTAINABLE',
        weeklyLoss: '0.5 lbs / week',
        tag: 'Easy to maintain',
        tagIcon: Zap,
      },
      {
        id: 'moderate',
        title: 'Moderate',
        category: 'MOST POPULAR',
        weeklyLoss: '1.0 lbs / week',
        tag: 'Balanced lifestyle',
        tagIcon: Scale,
        recommended: true,
      },
      {
        id: 'fast',
        title: 'Fast',
        category: 'AMBITIOUS GOAL',
        weeklyLoss: '2.0 lbs / week',
        tag: 'Aggressive deficit',
        tagIcon: Zap,
      },
    ]

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1">
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
              Choose your pace
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Your selection determines your daily calorie goal. A faster pace requires a more disciplined calorie deficit.
            </p>

            {/* Pace Options */}
            <div className="space-y-4 mb-6">
              {paces.map((pace) => {
                const TagIcon = pace.tagIcon
                const isSelected = planData.goalOptions?.pace === pace.id
                
                return (
                  <div key={pace.id} className="relative">
                    {/* Recommended Badge */}
                    {pace.recommended && (
                      <div 
                        className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold text-white z-10"
                        style={{ backgroundColor: accentColorValue }}
                      >
                        RECOMMENDED
                      </div>
                    )}
                    
                    <button
                      onClick={() => updateGoalOptions('pace', pace.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? ''
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: `${accentColorValue}10`,
                              borderColor: accentColorValue,
                            }
                          : {}
                      }
                    >
                      {/* Category Label */}
                      <div 
                        className="text-xs font-semibold mb-2 uppercase"
                        style={{ color: pace.recommended ? accentColorValue : 'var(--text-secondary)' }}
                      >
                        {pace.category}
                      </div>

                      {/* Title and Weekly Loss */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                            {pace.title}
                          </h3>
                          <p className="text-sm text-[var(--text-primary)]">
                            {pace.weeklyLoss}
                          </p>
                        </div>
                        
                        {/* Placeholder for image - using icon instead */}
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${accentColorValue}20` }}
                        >
                          <TagIcon size={24} style={{ color: accentColorValue }} />
                        </div>
                      </div>

                      {/* Tag */}
                      <div 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${accentColorValue}20`,
                          color: accentColorValue,
                        }}
                      >
                        <TagIcon size={14} />
                        <span>{pace.tag}</span>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Information Box */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)] mb-6">
              <div className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accentColorValue}20` }}
                >
                  <Info size={16} style={{ color: accentColorValue }} />
                </div>
                <p className="text-sm text-[var(--text-secondary)] flex-1">
                  Weight loss sustainability is generally higher at slower paces. You can change your pace at any time in your settings.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleNext}
              disabled={!planData.goalOptions?.pace}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
              }}
            >
              Continue
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
    }

    // Maintain Health: Show focus selection
    if (planData.goal === 'maintain-health') {
      const focuses = [
        {
          id: 'balanced_lifestyle',
          title: 'Balanced lifestyle',
          description: 'Find the right mix of food and fun.',
          icon: Leaf,
        },
        {
          id: 'more_energy',
          title: 'More energy',
          description: 'Fuel your body for a busy day.',
          icon: Zap,
        },
        {
          id: 'long_term_health',
          title: 'Long-term health',
          description: 'Focus on longevity and prevention.',
          icon: Heart,
        },
      ]

      return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
          <div className="w-full max-w-md mx-auto flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-12 pb-4">
              <button onClick={handleBack} className="text-[var(--text-primary)]">
                <span className="text-2xl">←</span>
              </button>
              <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
                Step {currentStep} of {totalSteps}
              </div>
            </div>

            {/* Progress */}
            <div className="px-6 mb-6">
              <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
              <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: accentColorValue,
                  }}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="px-6 flex-1">
              <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
                What's most important to you?
              </h2>

              {/* Focus Options */}
              <div className="space-y-3 mb-6">
                {focuses.map((focus) => {
                  const IconComponent = focus.icon
                  const isSelected = planData.goalOptions?.focus === focus.id
                  
                  return (
                    <button
                      key={focus.id}
                      onClick={() => updateGoalOptions('focus', focus.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left relative ${
                        isSelected
                          ? ''
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: `${accentColorValue}10`,
                              borderColor: accentColorValue,
                            }
                          : {}
                      }
                    >
                      {/* Checkmark for selected */}
                      {isSelected && (
                        <div 
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: accentColorValue }}
                        >
                          <Check size={16} className="text-white" />
                        </div>
                      )}

                      {/* Icon */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isSelected ? accentColorValue : `${accentColorValue}20`,
                        }}
                      >
                        <IconComponent 
                          size={24} 
                          className={isSelected ? 'text-white' : 'text-[var(--text-primary)]'}
                          style={!isSelected ? { color: accentColorValue } : {}}
                        />
                      </div>

                      {/* Text Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                          {focus.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {focus.description}
                        </p>
                      </div>

                      {/* Placeholder for image - using icon instead */}
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${accentColorValue}10` }}
                      >
                        <IconComponent size={24} style={{ color: accentColorValue, opacity: 0.5 }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Button */}
            <div className="px-6 pb-8">
              <button
                onClick={handleNext}
                disabled={!planData.goalOptions?.focus}
                className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: accentColorValue,
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '0.9'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
                }}
              >
                Next
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Build Muscle: Show training frequency
    if (planData.goal === 'build-muscle') {
      const trainingExperiences = ['Beginner', 'Intermediate', 'Advanced']
      const strengthTrainingDays = ['3 days', '4 days', '5–6 days']
      const fatGainTolerances = ['Minimal', 'Moderate']

      return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
          <div className="w-full max-w-md mx-auto flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-12 pb-4">
              <button onClick={handleBack} className="text-[var(--text-primary)]">
                <span className="text-2xl">←</span>
              </button>
              <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
                Step {currentStep} of {totalSteps}
              </div>
            </div>

            {/* Progress */}
            <div className="px-6 mb-6">
              <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
              <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: accentColorValue,
                  }}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="px-6 flex-1">
              <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
                Training frequency
              </h2>

              {/* Training Experience */}
              <div className="mb-8">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  How experienced are you with strength training?
                </h3>
                <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl">
                  {trainingExperiences.map((exp) => {
                    const isSelected = planData.goalOptions?.trainingExperience === exp.toLowerCase()
                    return (
                      <button
                        key={exp}
                        onClick={() => updateGoalOptions('trainingExperience', exp.toLowerCase())}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          isSelected ? '' : 'text-[var(--text-primary)]'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: accentColorValue,
                                color: 'white',
                              }
                            : {}
                        }
                      >
                        {exp}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Strength Training Days */}
              <div className="mb-8">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  How many days do you lift weights?
                </h3>
                <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl">
                  {strengthTrainingDays.map((days) => {
                    const isSelected = planData.goalOptions?.strengthTrainingDays === days
                    return (
                      <button
                        key={days}
                        onClick={() => updateGoalOptions('strengthTrainingDays', days)}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          isSelected ? '' : 'text-[var(--text-primary)]'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: accentColorValue,
                                color: 'white',
                              }
                            : {}
                        }
                      >
                        {days}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fat Gain Tolerance */}
              <div className="mb-6">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Are you okay with gaining a little fat while bulking?
                </h3>
                <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl">
                  {fatGainTolerances.map((tolerance) => {
                    const isSelected = planData.goalOptions?.fatGainTolerance === tolerance.toLowerCase()
                    return (
                      <button
                        key={tolerance}
                        onClick={() => updateGoalOptions('fatGainTolerance', tolerance.toLowerCase())}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                          isSelected ? '' : 'text-[var(--text-primary)]'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: accentColorValue,
                                color: 'white',
                              }
                            : {}
                        }
                      >
                        {tolerance}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="px-6 pb-8">
              <button
                onClick={handleNext}
                disabled={!planData.goalOptions?.trainingExperience || !planData.goalOptions?.strengthTrainingDays || !planData.goalOptions?.fatGainTolerance}
                className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: accentColorValue,
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.opacity = '0.9'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
                }}
              >
                Next
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Default fallback (should not happen)
    return null
  }

  // Step 6: Workout & Diet Experience
  if (currentStep === 6) {
    const workoutFrequencies = ['0-1', '2-3', '4-6']
    const dietExperiences = ['Beginner', 'Intermediate', 'Advanced']

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1">
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
              Workout & Diet Experience
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-8">
              Personalize your plan based on your current level and consistency.
            </p>

            {/* Workout Frequency Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Dumbbell size={24} style={{ color: accentColorValue }} />
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Workout frequency
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    (days per week)
                  </p>
                </div>
              </div>
              
              {/* Segmented Control */}
              <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl">
                {workoutFrequencies.map((freq) => {
                  const isSelected = planData.goalOptions?.workoutFrequency === freq
                  return (
                    <button
                      key={freq}
                      onClick={() => updateGoalOptions('workoutFrequency', freq)}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        isSelected ? '' : 'text-[var(--text-primary)]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: accentColorValue,
                              color: 'white',
                            }
                          : {}
                      }
                    >
                      {freq}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Diet Experience Section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Utensils size={24} style={{ color: accentColorValue }} />
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Diet experience
                </h3>
              </div>
              
              {/* Segmented Control */}
              <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl">
                {dietExperiences.map((exp) => {
                  const isSelected = planData.goalOptions?.dietExperience === exp.toLowerCase()
                  return (
                    <button
                      key={exp}
                      onClick={() => updateGoalOptions('dietExperience', exp.toLowerCase())}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        isSelected ? '' : 'text-[var(--text-primary)]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: accentColorValue,
                              color: 'white',
                            }
                          : {}
                      }
                    >
                      {exp}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Explanatory Text */}
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This helps us determine how precisely we should set your caloric goals and macro targets.
            </p>
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={handleNext}
              disabled={!planData.goalOptions?.workoutFrequency || !planData.goalOptions?.dietExperience}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = e.currentTarget.disabled ? '0.5' : '1'
              }}
            >
              Next Step
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 7: Results
  if (currentStep === 7) {
    // Map our data format to the function's expected format
    const mapActivityLevel = (level: string): string => {
      const mapping: Record<string, string> = {
        'sedentary': 'sedentary',
        'lightly-active': 'lightly-active',
        'moderately-active': 'moderate',
        'very-active': 'very-active',
        'extra-active': 'athlete',
      }
      return mapping[level] || 'moderate'
    }

    const mapGoal = (goal: string): string => {
      const mapping: Record<string, string> = {
        'lose-weight': 'lose_weight',
        'maintain-health': 'maintain_health',
        'build-muscle': 'build_muscle',
      }
      return mapping[goal] || goal
    }

    // Prepare input for calculation
    const calculationInput = {
      age: planData.age,
      sex: planData.sex,
      height: planData.height, // already in meters
      weight: planData.weight, // already in kg
      activityLevel: mapActivityLevel(planData.activityLevel || 'moderately-active'),
      goal: mapGoal(planData.goal || ''),
      goalOptions: planData.goalOptions || {},
    }

    // Calculate nutrition plan
    const nutritionPlan = calculateNutritionPlan(calculationInput)

    // Get goal title
    const getGoalTitle = (goalId: string): string => {
      const goalTitles: Record<string, string> = {
        'lose-weight': 'Lose Weight',
        'maintain-health': 'Maintain Health',
        'build-muscle': 'Build Muscle',
      }
      return goalTitles[goalId] || 'Fitness Goal'
    }

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-12 pb-4">
            <button onClick={handleBack} className="text-[var(--text-primary)]">
              <span className="text-2xl">←</span>
            </button>
            <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6">
            <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColorValue,
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 flex-1 overflow-y-auto pb-4">
            {/* Goal Display */}
            {planData.goal && (
              <div 
                className="mb-6 px-4 py-3 rounded-xl border-2"
                style={{ 
                  backgroundColor: `${accentColorValue}10`,
                  borderColor: accentColorValue,
                }}
              >
                <p className="text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">Your Goal</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {getGoalTitle(planData.goal)}
                </p>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
              Your Nutrition Plan
            </h2>

            {/* BMR & TDEE */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)] mb-1">BMR</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {nutritionPlan.bmr}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">calories/day</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)] mb-1">TDEE</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {nutritionPlan.tdee}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">calories/day</p>
              </div>
            </div>

            {/* Target Calories */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6 border-2" style={{ borderColor: accentColorValue }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[var(--text-primary)] uppercase">Daily Calorie Target</p>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ 
                    backgroundColor: `${accentColorValue}20`,
                    color: accentColorValue,
                  }}
                >
                  {nutritionPlan.calorieAdjustment > 0 ? '+' : ''}{nutritionPlan.calorieAdjustment} cal
                </div>
              </div>
              <p className="text-4xl font-bold text-[var(--text-primary)] mb-1">
                {nutritionPlan.targetCalories}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-2">calories per day</p>
              {/* Expected Weekly Change */}
              {nutritionPlan.expectedKgPerWeek !== undefined && nutritionPlan.expectedKgPerWeek !== 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Expected Weekly Change</p>
                  <p className={`text-lg font-semibold ${nutritionPlan.expectedKgPerWeek > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {nutritionPlan.expectedKgPerWeek > 0 ? '+' : ''}{nutritionPlan.expectedKgPerWeek.toFixed(2)} kg/week
                  </p>
                </div>
              )}
            </div>

            {/* Macros */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Macronutrients</h3>
              <div className="space-y-3">
                {/* Protein */}
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[var(--text-primary)]">Protein</span>
                    <span className="text-sm text-[var(--text-secondary)]">{Math.round(nutritionPlan.macros.protein.percentage * 10) / 10}%</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {nutritionPlan.macros.protein.grams}g
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {nutritionPlan.macros.protein.calories} cal
                    </span>
                  </div>
                  {planData.weight && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      ~{(nutritionPlan.macros.protein.grams / planData.weight).toFixed(1)} g/kg body weight
                    </p>
                  )}
                </div>

                {/* Carbs */}
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[var(--text-primary)]">Carbs</span>
                    <span className="text-sm text-[var(--text-secondary)]">{Math.round(nutritionPlan.macros.carbs.percentage * 10) / 10}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {nutritionPlan.macros.carbs.grams}g
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {nutritionPlan.macros.carbs.calories} cal
                    </span>
                  </div>
                </div>

                {/* Fats */}
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[var(--text-primary)]">Fats</span>
                    <span className="text-sm text-[var(--text-secondary)]">{Math.round(nutritionPlan.macros.fats.percentage * 10) / 10}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {nutritionPlan.macros.fats.grams}g
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {nutritionPlan.macros.fats.calories} cal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {nutritionPlan.notes.length > 0 && (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)] mb-6">
                <div className="flex items-start gap-3">
                  <Info size={20} style={{ color: accentColorValue }} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">Notes</h4>
                    <ul className="space-y-1">
                      {nutritionPlan.notes.map((note, index) => (
                        <li key={index} className="text-sm text-[var(--text-secondary)]">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Debug: Plan Data (Development Only) */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-color)] mb-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-3">Debug: Plan Data</h4>
                <pre className="text-xs text-left overflow-auto text-[var(--text-primary)] bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                  {JSON.stringify(planData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Bottom Button */}
          <div className="px-6 pb-8">
            <button
              onClick={() => {
                console.log('Final Plan Data:', JSON.stringify(planData, null, 2))
                console.log('Nutrition Plan:', JSON.stringify(nutritionPlan, null, 2))
                // You can add navigation or API call here
              }}
              className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ 
                backgroundColor: accentColorValue,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback (should not happen)
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-12 pb-4">
          <button onClick={handleBack} className="text-[var(--text-primary)]">
            <span className="text-2xl">←</span>
          </button>
          <div className="bg-[var(--bg-secondary)] px-4 py-1 rounded-full text-sm text-[var(--text-secondary)]">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 mb-6">
          <div className="text-xs text-[var(--text-secondary)] mb-2">PROGRESS</div>
          <div className="h-1 bg-[var(--bg-secondary)] rounded-full">
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                backgroundColor: accentColorValue,
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 flex-1 flex items-center justify-center">
          <div className="text-center w-full">
            <h2 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">Step {currentStep} Placeholder</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              This step will be implemented with specific questions.
            </p>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--border-color)]">
              <pre className="text-xs text-left overflow-auto text-[var(--text-primary)]">
                {JSON.stringify(planData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="px-6 pb-8">
          <button
            onClick={handleNext}
            className="w-full text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            style={{ 
              backgroundColor: accentColorValue,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            {currentStep === totalSteps ? 'Complete' : 'Next'}
            {currentStep < totalSteps && <span>→</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
