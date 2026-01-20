import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findById(session.user.id).select('theme accentColor weightUnit lengthUnit volumeUnit weightGoal stepsGoal waterGoal')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      theme: user.theme || 'dark',
      accentColor: user.accentColor || 'green',
      weightUnit: user.weightUnit || 'kg',
      lengthUnit: user.lengthUnit || 'm',
      volumeUnit: user.volumeUnit || 'ml',
      weightGoal: user.weightGoal,
      stepsGoal: user.stepsGoal,
      waterGoal: user.waterGoal,
    })
  } catch (error: any) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { theme, accentColor, weightUnit, lengthUnit, volumeUnit, weightGoal, stepsGoal, waterGoal, weightGoalUnit, waterGoalUnit } = await request.json()

    if (theme && !['light', 'dark'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      )
    }

    if (accentColor && !['green', 'blue', 'orange', 'purple'].includes(accentColor)) {
      return NextResponse.json(
        { error: 'Invalid accent color value' },
        { status: 400 }
      )
    }

    if (weightUnit && !['kg', 'lb'].includes(weightUnit)) {
      return NextResponse.json(
        { error: 'Invalid weight unit value' },
        { status: 400 }
      )
    }

    if (lengthUnit && !['m', 'ft'].includes(lengthUnit)) {
      return NextResponse.json(
        { error: 'Invalid length unit value' },
        { status: 400 }
      )
    }

    if (volumeUnit && !['ml', 'fl oz'].includes(volumeUnit)) {
      return NextResponse.json(
        { error: 'Invalid volume unit value' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Find the user first
    const user = await User.findById(session.user.id)
    
    if (!user) {
      console.error('[API] User not found with ID:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update the fields
    if (theme !== undefined) user.theme = theme
    if (accentColor !== undefined) user.accentColor = accentColor
    if (weightUnit !== undefined) user.weightUnit = weightUnit
    if (lengthUnit !== undefined) user.lengthUnit = lengthUnit
    if (volumeUnit !== undefined) user.volumeUnit = volumeUnit

    // Handle goals with unit conversion
    // Weight goal: convert to kg if provided in lb
    if (weightGoal !== undefined) {
      if (weightGoalUnit === 'lb') {
        // Convert lb to kg: 1 lb = 0.453592 kg
        user.weightGoal = weightGoal * 0.453592
      } else {
        // Already in kg or no unit specified (assume kg)
        user.weightGoal = weightGoal
      }
    }

    // Steps goal: no conversion needed
    if (stepsGoal !== undefined) {
      user.stepsGoal = stepsGoal
    }

    // Water goal: convert to ml if provided in fl oz
    if (waterGoal !== undefined) {
      if (waterGoalUnit === 'fl oz') {
        // Convert fl oz to ml: 1 fl oz = 29.5735 ml
        user.waterGoal = waterGoal * 29.5735
      } else {
        // Already in ml or no unit specified (assume ml)
        user.waterGoal = waterGoal
      }
    }

    console.log('[API] Received update request:', { theme, accentColor, weightUnit, lengthUnit, volumeUnit, weightGoal, stepsGoal, waterGoal })
    console.log('[API] User ID:', session.user.id)

    // Save the document explicitly
    await user.save()
    
    console.log('[API] User document after save:', {
      weightUnit: user.weightUnit,
      lengthUnit: user.lengthUnit,
      volumeUnit: user.volumeUnit,
      theme: user.theme,
      accentColor: user.accentColor,
      weightGoal: user.weightGoal,
      stepsGoal: user.stepsGoal,
      waterGoal: user.waterGoal,
    })

    // Return only the requested fields
    const returnData: any = {
      theme: user.theme ?? 'dark',
      accentColor: user.accentColor ?? 'green',
      weightUnit: user.weightUnit ?? 'kg',
      lengthUnit: user.lengthUnit ?? 'm',
      volumeUnit: user.volumeUnit ?? 'ml',
      weightGoal: user.weightGoal,
      stepsGoal: user.stepsGoal,
      waterGoal: user.waterGoal,
    }
    
    console.log('[API] Returning data:', returnData)

    // Return the actual saved values, not defaults
    return NextResponse.json(returnData)
  } catch (error: any) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
