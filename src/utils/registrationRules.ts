/**
 * Pure business logic and validation rules for event registrations.
 * Decoupled from UI and database drivers for high-speed unit testing.
 */

export interface RegistrationInput {
  fullName: string;
  email: string;
  organization: string;
  domainInterests: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface EventCapacityState {
  maxCapacity: number;
  confirmedRegistrationsCount: number;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline: string | Date;
}

/**
 * Normalizes email by trimming and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates registration form inputs.
 */
export function validateRegistrationInput(input: Partial<RegistrationInput>): ValidationResult {
  const errors: Record<string, string> = {};

  // Full Name
  const trimmedName = (input.fullName || '').trim();
  if (!trimmedName) {
    errors.fullName = 'Full name is required.';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (trimmedName.length > 100) {
    errors.fullName = 'Full name cannot exceed 100 characters.';
  }

  // Email
  const trimmedEmail = (input.email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = 'Please provide a valid email address.';
  } else if (trimmedEmail.length > 150) {
    errors.email = 'Email address cannot exceed 150 characters.';
  }

  // College or Organization
  const trimmedOrg = (input.organization || '').trim();
  if (!trimmedOrg) {
    errors.organization = 'College or organization is required.';
  } else if (trimmedOrg.length < 2) {
    errors.organization = 'Organization must be at least 2 characters.';
  } else if (trimmedOrg.length > 150) {
    errors.organization = 'Organization cannot exceed 150 characters.';
  }

  // Domain interests
  if (!input.domainInterests || !Array.isArray(input.domainInterests) || input.domainInterests.length === 0) {
    errors.domainInterests = 'Please select at least one domain interest.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Determines whether registration is currently allowed for an event.
 */
export function calculateEventAvailability(event: EventCapacityState, currentDate: Date = new Date()): {
  isAvailable: boolean;
  reason?: 'CANCELLED' | 'COMPLETED' | 'DRAFT' | 'DEADLINE_PASSED' | 'CAPACITY_REACHED';
  remainingCapacity: number;
} {
  const remaining = Math.max(0, event.maxCapacity - event.confirmedRegistrationsCount);

  if (event.status === 'cancelled') {
    return { isAvailable: false, reason: 'CANCELLED', remainingCapacity: remaining };
  }
  if (event.status === 'completed') {
    return { isAvailable: false, reason: 'COMPLETED', remainingCapacity: remaining };
  }
  if (event.status === 'draft') {
    return { isAvailable: false, reason: 'DRAFT', remainingCapacity: remaining };
  }

  const deadline = new Date(event.registrationDeadline);
  if (currentDate.getTime() > deadline.getTime()) {
    return { isAvailable: false, reason: 'DEADLINE_PASSED', remainingCapacity: remaining };
  }

  if (remaining <= 0) {
    return { isAvailable: false, reason: 'CAPACITY_REACHED', remainingCapacity: 0 };
  }

  return { isAvailable: true, remainingCapacity: remaining };
}

/**
 * Generates an uppercase reference code e.g. REG-78249-ABC
 */
export function generateRegistrationRef(prefix = 'EVF'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Formats date and time cleanly for display.
 */
export function formatEventDateTime(dateString: string | Date, timeZone = 'UTC'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timeZone || 'UTC',
  }).format(date);
}
