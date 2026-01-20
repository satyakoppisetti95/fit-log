import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  username: string
  password: string
  theme?: 'light' | 'dark'
  accentColor?: 'green' | 'blue' | 'orange' | 'purple'
  weightUnit?: 'kg' | 'lb'
  lengthUnit?: 'm' | 'ft'
  volumeUnit?: 'ml' | 'fl oz'
  weightGoal?: number // stored in kg
  stepsGoal?: number
  waterGoal?: number // stored in ml
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
    accentColor: {
      type: String,
      enum: ['green', 'blue', 'orange', 'purple'],
      default: 'green',
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg',
    },
    lengthUnit: {
      type: String,
      enum: ['m', 'ft'],
      default: 'm',
    },
    volumeUnit: {
      type: String,
      enum: ['ml', 'fl oz'],
      default: 'ml',
    },
    weightGoal: {
      type: Number,
      min: 0,
    },
    stepsGoal: {
      type: Number,
      min: 0,
    },
    waterGoal: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent re-compilation during development
const User: Model<IUser> = (mongoose.models && mongoose.models.User) 
  ? mongoose.models.User 
  : mongoose.model<IUser>('User', UserSchema)

export default User
