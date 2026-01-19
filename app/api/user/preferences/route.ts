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
    const user = await User.findById(session.user.id).select('theme accentColor weightUnit lengthUnit volumeUnit')

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

    const { theme, accentColor, weightUnit, lengthUnit, volumeUnit } = await request.json()

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
    
    // Build update object - include all provided values
    const updateData: any = {}
    if (theme !== undefined) updateData.theme = theme
    if (accentColor !== undefined) updateData.accentColor = accentColor
    if (weightUnit !== undefined) updateData.weightUnit = weightUnit
    if (lengthUnit !== undefined) updateData.lengthUnit = lengthUnit
    if (volumeUnit !== undefined) updateData.volumeUnit = volumeUnit

    console.log('[API] Received update request:', { theme, accentColor, weightUnit, lengthUnit, volumeUnit })
    console.log('[API] Update data object:', updateData)
    console.log('[API] User ID:', session.user.id)
    
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

    // Save the document explicitly
    await user.save()
    
    console.log('[API] User document after save:', {
      weightUnit: user.weightUnit,
      lengthUnit: user.lengthUnit,
      volumeUnit: user.volumeUnit,
      theme: user.theme,
      accentColor: user.accentColor,
    })

    // Return only the requested fields
    const returnData: any = {
      theme: user.theme ?? 'dark',
      accentColor: user.accentColor ?? 'green',
      weightUnit: user.weightUnit ?? 'kg',
      lengthUnit: user.lengthUnit ?? 'm',
      volumeUnit: user.volumeUnit ?? 'ml',
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
