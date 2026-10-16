import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  venue: string;
  format: 'In-Person' | 'Online' | 'Hybrid';
  maxCapacity: number;
  registrationDeadline: Date;
  imageUrl?: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
  prerequisites?: string;
  speakerInfo?: {
    name: string;
    role: string;
    bio?: string;
    company?: string;
  };
  confirmedRegistrationsCount: number;
  waitlistedRegistrationsCount: number;
  cancelledRegistrationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Event title must be at least 3 characters'],
      maxlength: [150, 'Event title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [280, 'Short description cannot exceed 280 characters'],
    },
    fullDescription: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
      maxlength: [5000, 'Full description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Technology',
        'Engineering',
        'Career & Networking',
        'Design & Product',
        'Science & Research',
        'Workshop & Hackathon',
        'Leadership'
      ],
      default: 'Technology',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
    venue: {
      type: String,
      required: [true, 'Venue or online platform is required'],
      trim: true,
    },
    format: {
      type: String,
      enum: ['In-Person', 'Online', 'Hybrid'],
      default: 'In-Person',
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Maximum capacity must be at least 1'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    prerequisites: {
      type: String,
      trim: true,
    },
    speakerInfo: {
      name: { type: String, trim: true },
      role: { type: String, trim: true },
      bio: { type: String, trim: true },
      company: { type: String, trim: true },
    },
    confirmedRegistrationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    waitlistedRegistrationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledRegistrationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Filtering indexes
EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ category: 1, status: 1 });
EventSchema.index({ registrationDeadline: 1 });
EventSchema.index({ title: 'text', shortDescription: 'text', venue: 'text' });

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
