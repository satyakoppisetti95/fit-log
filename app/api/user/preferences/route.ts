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
    const user = await User.findById(session.user.id).select('theme accentColor')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      theme: user.theme || 'dark',
      accentColor: user.accentColor || 'green',
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

    const { theme, accentColor } = await request.json()

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

    await connectDB()
    const updateData: any = {}
    if (theme) updateData.theme = theme
    if (accentColor) updateData.accentColor = accentColor

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    ).select('theme accentColor')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      theme: user.theme || 'dark',
      accentColor: user.accentColor || 'green',
    })
  } catch (error: any) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
