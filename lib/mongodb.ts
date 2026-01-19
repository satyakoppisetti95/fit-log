import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use global variable to maintain a cached connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB(): Promise<typeof mongoose> {
  // Read MONGODB_URI from process.env inside the function
  // This ensures it's read after dotenv has loaded the .env.local file
  const MONGODB_URI = process.env.MONGODB_URI || ''
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 10000, // 10 second socket timeout
      connectTimeoutMS: 10000, // 10 second connection timeout
    }

    console.log('Connecting to MongoDB...')
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully')
      return mongoose
    }).catch((error: any) => {
      console.error('MongoDB connection error:', error.message)
      console.error('MongoDB connection error details:', {
        name: error.name,
        code: error.code,
        message: error.message
      })
      cached.promise = null
      // Clear the connection cache on error
      cached.conn = null
      throw new Error(`MongoDB connection failed: ${error.message}. Please check if MongoDB is running and MONGODB_URI is correct.`)
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e: any) {
    cached.promise = null
    console.error('MongoDB connection failed:', e.message)
    throw new Error(`Failed to connect to MongoDB: ${e.message}`)
  }

  return cached.conn
}

export default connectDB
