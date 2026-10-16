import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
  eventId: Types.ObjectId;
  fullName: string;
  email: string;
  normalizedEmail: string;
  organization: string;
  domainInterests: string[];
  registrationRef: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  notes?: string;
  registeredAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      maxlength: [150, 'Email cannot exceed 150 characters'],
    },
    normalizedEmail: {
      type: String,
      required: [true, 'Normalized email is required'],
      trim: true,
      lowercase: true,
    },
    organization: {
      type: String,
      required: [true, 'College or organization is required'],
      trim: true,
      minlength: [2, 'Organization must be at least 2 characters'],
      maxlength: [150, 'Organization cannot exceed 150 characters'],
    },
    domainInterests: {
      type: [String],
      required: [true, 'At least one domain interest is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one domain interest must be selected',
      },
    },
    registrationRef: {
      type: String,
      required: [true, 'Registration reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'waitlisted', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// MANDATORY COMPOUND UNIQUE DATABASE INDEX
// Enforces that one normalized email cannot register twice for the same event
RegistrationSchema.index({ eventId: 1, normalizedEmail: 1 }, { unique: true });

// Filter and query performance indexes
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ normalizedEmail: 1 });
RegistrationSchema.index({ registeredAt: -1 });

export const Registration =
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);
