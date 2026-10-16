import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'superadmin' | 'admin';
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return in default queries
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin'],
      default: 'admin',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AdminUserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const AdminUser =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
