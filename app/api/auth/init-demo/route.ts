import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    await connectDB()

    const username = 'demo'
    const password = 'password'

    // Check if demo user already exists
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return NextResponse.json(
        {
          success: true,
          message: 'Demo user already exists',
          user: {
            id: existingUser._id.toString(),
            username: existingUser.username,
          },
        },
        { status: 200 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create demo user
    const user = await User.create({
      username,
      password: hashedPassword,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Demo user created successfully',
        user: {
          id: user._id.toString(),
          username: user.username,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error initializing demo user:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize demo user',
      },
      { status: 500 }
    )
  }
}
