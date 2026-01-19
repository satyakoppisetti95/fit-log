import bcrypt from 'bcryptjs'
import connectDB from './mongodb'
import User from '@/models/User'

export interface User {
  id: string
  username: string
}

export async function verifyPassword(username: string, password: string): Promise<User | null> {
  try {
    console.log('[AUTH] verifyPassword called for:', username)
    console.log('[AUTH] Connecting to DB...')
    await connectDB()
    console.log('[AUTH] DB connected, querying user...')
    
    const user = await User.findOne({ username: username.toLowerCase() })
    console.log('[AUTH] User query result:', user ? 'found' : 'not found')
    
    if (!user) {
      console.log('[AUTH] User not found in database')
      return null
    }

    console.log('[AUTH] Comparing password...')
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[AUTH] Password comparison result:', isValid)
    
    if (!isValid) {
      console.log('[AUTH] Invalid password')
      return null
    }

    console.log('[AUTH] Password verified successfully')
    return {
      id: user._id.toString(),
      username: user.username,
    }
  } catch (error: any) {
    console.error('[AUTH] Error verifying password:', error)
    console.error('[AUTH] Error message:', error.message)
    console.error('[AUTH] Error stack:', error.stack)
    return null
  }
}

export async function createUser(username: string, password: string): Promise<User | null> {
  try {
    await connectDB()
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() })
    if (existingUser) {
      return null
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
    })

    return {
      id: user._id.toString(),
      username: user.username,
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}
