import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Registration } from '../models/Registration.ts';
import { Event } from '../models/Event.ts';
import { requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

export const adminRegistrationsRouter = Router();

adminRegistrationsRouter.use(requireAdminAuth);

/**
 * GET /api/admin/registrations
 * List registrations with search, event filter, status filter, and pagination
 */
adminRegistrationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      eventId,
      status,
      q,
      page = '1',
      limit = '20',
      sort = 'registeredAt_desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (eventId && typeof eventId === 'string' && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = eventId;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { organization: searchRegex },
        { registrationRef: searchRegex },
        { domainInterests: searchRegex },
      ];
    }

    let sortObj: Record<string, any> = { registeredAt: -1 };
    if (sort === 'registeredAt_asc') sortObj = { registeredAt: 1 };
    if (sort === 'name_asc') sortObj = { fullName: 1 };

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .populate('eventId', 'title startDate endDate venue format maxCapacity confirmedRegistrationsCount')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    res.json({
      success: true,
      registrations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('[Admin Registrations API Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATIONS_FETCH_ERROR', message: 'Unable to retrieve registrations.' },
    });
  }
});

/**
 * PATCH /api/admin/registrations/:id/status
 * Updates participant status and atomically adjusts capacity counters
 */
adminRegistrationsRouter.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['confirmed', 'waitlisted', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be confirmed, waitlisted, or cancelled.' },
      });
      return;
    }

    const registration = await Registration.findById(id);
    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration record not found.' },
      });
      return;
    }

    const oldStatus = registration.status;
    if (oldStatus === status) {
      res.json({
        success: true,
        message: 'Status is already set to ' + status,
        registration,
      });
      return;
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Associated event could not be found.' },
      });
      return;
    }

    // Capacity adjustment logic based on status transitions
    if (oldStatus === 'confirmed' && status === 'cancelled') {
      // Free up 1 seat atomically
      await Event.findByIdAndUpdate(event._id, {
        $inc: {
          confirmedRegistrationsCount: -1,
          cancelledRegistrationsCount: 1,
        },
      });
      registration.cancelledAt = new Date();
      registration.cancellationReason = reason || 'Cancelled by administrator';
    } else if (oldStatus === 'cancelled' && status === 'confirmed') {
      // Re-admit participant: must ensure capacity is available
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event._id,
          $expr: { $lt: ['$confirmedRegistrationsCount', '$maxCapacity'] },
        },
        {
          $inc: {
            confirmedRegistrationsCount: 1,
            cancelledRegistrationsCount: -1,
          },
        },
        { new: true }
      );

      if (!updatedEvent) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CAPACITY_REACHED',
            message: 'Cannot re-confirm registration: the event is currently at maximum capacity.',
          },
        });
        return;
      }
      registration.cancelledAt = undefined;
      registration.cancellationReason = undefined;
    }

    registration.status = status;
    await registration.save();

    res.json({
      success: true,
      message: `Registration status updated to ${status}.`,
      registration,
    });
  } catch (error) {
    console.error('[Update Registration Status Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_UPDATE_FAILED', message: 'Failed to update registration status.' },
    });
  }
});

/**
 * GET /api/admin/registrations/export
 * Exports registrations to CSV
 */
adminRegistrationsRouter.get('/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId, status } = req.query;

    const filter: Record<string, any> = {};
    if (eventId && typeof eventId === 'string' && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = eventId;
    }
    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    const registrations = await Registration.find(filter)
      .populate('eventId', 'title category venue')
      .sort({ registeredAt: -1 })
      .lean();

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      'Registration Ref',
      'Event Title',
      'Category',
      'Full Name',
      'Email Address',
      'Organization / College',
      'Domain Interests',
      'Status',
      'Registered At',
    ];

    const rows = registrations.map((r: any) => [
      escapeCsv(r.registrationRef),
      escapeCsv(r.eventId?.title || 'Unknown Event'),
      escapeCsv(r.eventId?.category || 'N/A'),
      escapeCsv(r.fullName),
      escapeCsv(r.email),
      escapeCsv(r.organization),
      escapeCsv((r.domainInterests || []).join('; ')),
      escapeCsv(r.status),
      escapeCsv(new Date(r.registeredAt).toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const filename = `eventflow_registrations_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('[CSV Export Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: 'Unable to export registration data.' },
    });
  }
});
