export interface SpeakerInfo {
  name: string;
  role: string;
  company?: string;
  bio?: string;
}

export interface EventItem {
  _id: string;
  title: string;
  slug?: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  venue: string;
  format: 'In-Person' | 'Online' | 'Hybrid';
  maxCapacity: number;
  registrationDeadline: string;
  imageUrl?: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
  prerequisites?: string;
  speakerInfo?: SpeakerInfo;
  confirmedRegistrationsCount: number;
  waitlistedRegistrationsCount?: number;
  cancelledRegistrationsCount?: number;
  remainingCapacity: number;
  isFull?: boolean;
  isPastDeadline?: boolean;
  isRegistrationOpen?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationItem {
  _id: string;
  eventId: EventItem | string;
  fullName: string;
  email: string;
  normalizedEmail: string;
  organization: string;
  domainInterests: string[];
  registrationRef: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  notes?: string;
  registeredAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  lastLogin?: string;
}

export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalCapacity: number;
  totalConfirmedRegistrations: number;
  totalCancelledRegistrations: number;
  totalRegistrations: number;
  remainingCapacity: number;
  occupancyRate: number;
  categoryDistribution: {
    category: string;
    eventsCount: number;
    confirmedRegistrations: number;
  }[];
}
