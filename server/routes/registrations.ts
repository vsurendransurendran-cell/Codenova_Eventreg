import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event.ts';
import { Registration } from '../models/Registration.ts';
import {
  normalizeEmail,
  validateRegistrationInput,
  generateRegistrationRef,
} from '../../src/utils/registrationRules.ts';

export const registrationsRouter = Router();

/**
 * POST /api/events/:id/register
 * Concurrency-safe, duplicate-preventing registration endpoint.
 */
registrationsRouter.post('/:id/register', async (req: Request, res: Response) => {
  const eventId = req.params.id;

  try {
    if (!eventId || !eventId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_EVENT_ID', message: 'Invalid event identifier.' },
      });
      return;
    }

    const { fullName, email, organization, domainInterests, notes } = req.body;

    // 1. Independent Server-Side Input Validation
    const validation = validateRegistrationInput({
      fullName,
      email,
      organization,
      domainInterests,
    });

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please review and fix the validation errors.',
          details: validation.errors,
        },
      });
      return;
    }

    const cleanEmail = normalizeEmail(email);

    // 2. Pre-check for duplicate registration to fail fast
    const existingRegistration = await Registration.findOne({
      eventId,
      normalizedEmail: cleanEmail,
      status: { $ne: 'cancelled' },
    });

    if (existingRegistration) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REGISTRATION',
          message: 'This email address is already registered for this event.',
        },
      });
      return;
    }

    // 3. Inspect Event state before atomic reservation
    const currentEvent = await Event.findById(eventId);
    if (!currentEvent) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
      });
      return;
    }

    const now = new Date();

    if (currentEvent.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_CANCELLED',
          message: 'Registration is closed because this event has been cancelled.',
        },
      });
      return;
    }

    if (currentEvent.status === 'completed') {
      res.status(400).json({
        success: false,
        error: {
          code: 'EVENT_COMPLETED',
          message: 'Registration is closed because this event has already concluded.',
        },
      });
      return;
    }

    if (now > new Date(currentEvent.registrationDeadline)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DEADLINE_PASSED',
          message: 'The registration deadline for this event has passed.',
        },
      });
      return;
    }

    // 4. ATOMIC CAPACITY RESERVATION
    // Concurrency-safe: atomically increments confirmedRegistrationsCount only if < maxCapacity
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: { $in: ['upcoming', 'ongoing'] },
        registrationDeadline: { $gte: now },
        $expr: { $lt: ['$confirmedRegistrationsCount', '$maxCapacity'] },
      },
      {
        $inc: { confirmedRegistrationsCount: 1 },
      },
      { new: true }
    );

    if (!updatedEvent) {
      // Re-query to report accurate failure reason
      const recheckedEvent = await Event.findById(eventId);
      const isFull =
        recheckedEvent &&
        recheckedEvent.confirmedRegistrationsCount >= recheckedEvent.maxCapacity;

      if (isFull) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CAPACITY_REACHED',
            message: 'This event has reached its maximum participant capacity. No more seats are available.',
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'REGISTRATION_UNAVAILABLE',
          message: 'Registration could not be completed at this time.',
        },
      });
      return;
    }

    // 5. ATTEMPT REGISTRATION DOCUMENT CREATION
    const registrationRef = generateRegistrationRef();

    try {
      const registration = await Registration.create({
        eventId,
        fullName: fullName.trim(),
        email: email.trim(),
        normalizedEmail: cleanEmail,
        organization: organization.trim(),
        domainInterests: Array.isArray(domainInterests)
          ? domainInterests
          : [domainInterests],
        registrationRef,
        status: 'confirmed',
        notes: notes ? notes.trim() : '',
        registeredAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Registration successfully confirmed!',
        registration: {
          id: registration._id,
          registrationRef: registration.registrationRef,
          fullName: registration.fullName,
          email: registration.email,
          organization: registration.organization,
          domainInterests: registration.domainInterests,
          status: registration.status,
          registeredAt: registration.registeredAt,
        },
        event: {
          id: updatedEvent._id,
          title: updatedEvent.title,
          startDate: updatedEvent.startDate,
          endDate: updatedEvent.endDate,
          timeZone: updatedEvent.timeZone,
          venue: updatedEvent.venue,
          format: updatedEvent.format,
          remainingCapacity: Math.max(
            0,
            updatedEvent.maxCapacity - updatedEvent.confirmedRegistrationsCount
          ),
        },
      });
    } catch (saveError: any) {
      // 6. ROLLBACK CAPACITY RESERVATION UPON FAILURE (e.g. Unique Index 11000)
      console.warn('[Registration Rollback] Reverting capacity increment due to save error:', saveError.message);
      await Event.findByIdAndUpdate(eventId, {
        $inc: { confirmedRegistrationsCount: -1 },
      });

      // Handle duplicate key error 11000 from MongoDB unique index
      if (saveError.code === 11000) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_REGISTRATION',
            message: 'This email address is already registered for this event.',
          },
        });
        return;
      }

      throw saveError;
    }
  } catch (error) {
    console.error('[Registration Endpoint Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'An unexpected server error occurred during registration. Please try again.',
      },
    });
  }
});

/**
 * GET /api/registrations/verify/:ref
 * Lookup and verify a registration reference code
 */
registrationsRouter.get('/verify/:ref', async (req: Request, res: Response) => {
  try {
    const { ref } = req.params;
    const cleanRef = (ref || '').trim().toUpperCase();

    const registration = await Registration.findOne({ registrationRef: cleanRef })
      .populate('eventId', 'title startDate endDate venue format status')
      .lean() as any;

    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'REGISTRATION_NOT_FOUND', message: 'No registration found with this reference code.' },
      });
      return;
    }

    res.json({
      success: true,
      registration: {
        registrationRef: registration.registrationRef,
        fullName: registration.fullName,
        organization: registration.organization,
        domainInterests: registration.domainInterests,
        status: registration.status,
        registeredAt: registration.registeredAt,
        event: registration.eventId,
      },
    });
  } catch (error) {
    console.error('[Registration Verify Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_ERROR', message: 'Unable to verify registration reference.' },
    });
  }
});
