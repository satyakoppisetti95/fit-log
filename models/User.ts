import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  username: string
  password: string
  theme?: 'light' | 'dark'
  accentColor?: 'green' | 'blue' | 'orange' | 'purple'
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
