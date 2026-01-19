/**
 * Script to initialize demo user in MongoDB
 * Run with: npm run init-demo
 * Or: npx tsx scripts/init-demo-user.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import mongoose from 'mongoose'
import connectDB from '../lib/mongodb'
import User from '../models/User'
import bcrypt from 'bcryptjs'

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local')
console.log('Looking for .env.local at:', envPath)

if (existsSync(envPath)) {
  const result = config({ path: envPath, override: true })
  if (result.error) {
    console.error('Error loading .env.local:', result.error)
  } else {
    console.log('✓ Loaded .env.local successfully')
  }
} else {
  console.warn('⚠️  .env.local file not found at:', envPath)
  console.warn('Trying to load from .env...')
  const result = config({ override: true }) // Try default .env
  if (result.error) {
    console.warn('No .env file found either')
  }
}

// Debug: Check if MONGODB_URI is loaded
if (process.env.MONGODB_URI) {
  console.log('✓ MONGODB_URI found in environment')
  // Don't print the full URI for security, just show it's set
  console.log('  URI starts with:', process.env.MONGODB_URI.substring(0, 20) + '...')
} else {
  console.log('✗ MONGODB_URI not found in environment')
}

async function initDemoUser() {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI is not set')
      console.error('Current working directory:', process.cwd())
      console.error('Looking for .env.local at:', resolve(process.cwd(), '.env.local'))
      console.error('File exists:', existsSync(resolve(process.cwd(), '.env.local')))
      console.error('\nPlease ensure .env.local exists in the project root with:')
      console.error('MONGODB_URI=mongodb://localhost:27017/fitlog')
      console.error('JWT_SECRET=your-secret-key-here')
      process.exit(1)
    }
    
    console.log('✓ MONGODB_URI is set')

    console.log('🔌 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to MongoDB')

    const username = 'demo'
    const password = 'password'

    // Check if demo user already exists
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      console.log('ℹ️  Demo user already exists')
      console.log('   Username:', existingUser.username)
      console.log('   ID:', existingUser._id.toString())
      await mongoose.connection.close()
      process.exit(0)
      return
    }

    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create demo user
    console.log('👤 Creating demo user...')
    const user = await User.create({
      username,
      password: hashedPassword,
    })

    console.log('✅ Demo user created successfully!')
    console.log('   Username:', user.username)
    console.log('   Password: password')
    console.log('   ID:', user._id.toString())
    
    await mongoose.connection.close()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error initializing demo user:')
    if (error.message) {
      console.error('   ', error.message)
    } else {
      console.error('   ', error)
    }
    
    // Try to close connection if it exists
    try {
      await mongoose.connection.close()
    } catch {
      // Ignore
    }
    
    process.exit(1)
  }
}

initDemoUser()
