import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event.ts';
import { Registration } from '../models/Registration.ts';
import { requireAdminAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

export const adminEventsRouter = Router();

// Apply admin authentication to all routes
adminEventsRouter.use(requireAdminAuth);

/**
 * GET /api/admin/events/stats
 * Real-time, calculated database metrics for dashboard
 */
adminEventsRouter.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();

    const [
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      cancelledEvents,
      registrationAgg,
      categoryDistribution,
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'upcoming', startDate: { $gt: now } }),
      Event.countDocuments({ status: { $in: ['upcoming', 'ongoing'] }, startDate: { $lte: now }, endDate: { $gte: now } }),
      Event.countDocuments({ $or: [{ status: 'completed' }, { endDate: { $lt: now } }] }),
      Event.countDocuments({ status: 'cancelled' }),
      Event.aggregate([
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: '$maxCapacity' },
            totalConfirmed: { $sum: '$confirmedRegistrationsCount' },
            totalCancelled: { $sum: '$cancelledRegistrationsCount' },
          },
        },
      ]),
      Event.aggregate([
        {
          $group: {
            _id: '$category',
            eventsCount: { $sum: 1 },
            confirmedRegistrations: { $sum: '$confirmedRegistrationsCount' },
          },
        },
        { $sort: { confirmedRegistrations: -1 } },
      ]),
    ]);

    const totalRegistrations = await Registration.countDocuments();
    const confirmedRegistrations = await Registration.countDocuments({ status: 'confirmed' });
    const cancelledRegistrations = await Registration.countDocuments({ status: 'cancelled' });

    const totalCapacity = registrationAgg[0]?.totalCapacity || 0;
    const confirmedCount = registrationAgg[0]?.totalConfirmed || confirmedRegistrations;
    const remainingCapacity = Math.max(0, totalCapacity - confirmedCount);

    res.json({
      success: true,
      stats: {
        totalEvents,
        upcomingEvents,
        ongoingEvents,
        completedEvents,
        cancelledEvents,
        totalCapacity,
        totalConfirmedRegistrations: confirmedCount,
        totalCancelledRegistrations: cancelledRegistrations,
        totalRegistrations,
        remainingCapacity,
        occupancyRate: totalCapacity > 0 ? Math.round((confirmedCount / totalCapacity) * 100) : 0,
        categoryDistribution: categoryDistribution.map((item) => ({
          category: item._id,
          eventsCount: item.eventsCount,
          confirmedRegistrations: item.confirmedRegistrations,
        })),
      },
    });
  } catch (error) {
    console.error('[Admin Stats API Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_FETCH_ERROR', message: 'Unable to calculate dashboard metrics.' },
    });
  }
});

/**
 * GET /api/admin/events
 * Admin event listing with status filters, search, and pagination
 */
adminEventsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, category, status, page = '1', limit = '15', sort = 'date_asc' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = category;
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { venue: searchRegex },
      ];
    }

    let sortObj: Record<string, any> = { startDate: 1 };
    if (sort === 'date_desc') sortObj = { startDate: -1 };
    if (sort === 'title_asc') sortObj = { title: 1 };
    if (sort === 'registrations_desc') sortObj = { confirmedRegistrationsCount: -1 };

    const [events, total] = await Promise.all([
      Event.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(filter),
    ]);

    const formattedEvents = events.map((event: any) => {
      const remainingCapacity = Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0));
      return {
        ...event,
        remainingCapacity,
      };
    });

    res.json({
      success: true,
      events: formattedEvents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('[Admin Events API Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'ADMIN_EVENTS_FETCH_ERROR', message: 'Unable to retrieve administrative events list.' },
    });
  }
});

/**
 * POST /api/admin/events
 * Create new event
 */
adminEventsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      shortDescription,
      fullDescription,
      category,
      startDate,
      endDate,
      timeZone = 'UTC',
      venue,
      format = 'In-Person',
      maxCapacity,
      registrationDeadline,
      imageUrl,
      status = 'upcoming',
      tags = [],
      prerequisites,
      speakerInfo,
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = new Date(registrationDeadline);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(deadline.getTime())) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: 'One or more provided dates are invalid.' },
      });
      return;
    }

    if (end <= start) {
      res.status(400).json({
        success: false,
        error: { code: 'DATE_ORDER_ERROR', message: 'Event end date must be after the start date.' },
      });
      return;
    }

    if (deadline > end) {
      res.status(400).json({
        success: false,
        error: { code: 'DEADLINE_ORDER_ERROR', message: 'Registration deadline cannot be after the event ends.' },
      });
      return;
    }

    const capacityNum = parseInt(maxCapacity, 10);
    if (isNaN(capacityNum) || capacityNum < 1) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CAPACITY', message: 'Maximum capacity must be an integer greater than 0.' },
      });
      return;
    }

    const event = await Event.create({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      category,
      startDate: start,
      endDate: end,
      timeZone,
      venue: venue.trim(),
      format,
      maxCapacity: capacityNum,
      registrationDeadline: deadline,
      imageUrl: imageUrl ? imageUrl.trim() : undefined,
      status,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [],
      prerequisites: prerequisites ? prerequisites.trim() : undefined,
      speakerInfo,
      confirmedRegistrationsCount: 0,
      waitlistedRegistrationsCount: 0,
      cancelledRegistrationsCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Event successfully created.',
      event,
    });
  } catch (error: any) {
    console.error('[Create Event Error]', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'EVENT_CREATE_FAILED', message: 'Failed to create event.' },
    });
  }
});

/**
 * PUT /api/admin/events/:id
 * Edit existing event with capacity consistency checks
 */
adminEventsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid event identifier.' },
      });
      return;
    }

    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
      });
      return;
    }

    const {
      title,
      shortDescription,
      fullDescription,
      category,
      startDate,
      endDate,
      timeZone,
      venue,
      format,
      maxCapacity,
      registrationDeadline,
      imageUrl,
      status,
      tags,
      prerequisites,
      speakerInfo,
    } = req.body;

    // Check capacity reduction rule: cannot reduce maxCapacity below already confirmed registrations
    if (maxCapacity !== undefined) {
      const newCapacity = parseInt(maxCapacity, 10);
      if (isNaN(newCapacity) || newCapacity < 1) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_CAPACITY', message: 'Maximum capacity must be at least 1.' },
        });
        return;
      }

      if (newCapacity < existingEvent.confirmedRegistrationsCount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CAPACITY_REDUCTION_CONFLICT',
            message: `Cannot reduce maximum capacity to ${newCapacity} because ${existingEvent.confirmedRegistrationsCount} participants are already confirmed.`,
          },
        });
        return;
      }
      existingEvent.maxCapacity = newCapacity;
    }

    if (title) existingEvent.title = title.trim();
    if (shortDescription) existingEvent.shortDescription = shortDescription.trim();
    if (fullDescription) existingEvent.fullDescription = fullDescription.trim();
    if (category) existingEvent.category = category;
    if (venue) existingEvent.venue = venue.trim();
    if (format) existingEvent.format = format;
    if (timeZone) existingEvent.timeZone = timeZone;
    if (status) existingEvent.status = status;
    if (imageUrl !== undefined) existingEvent.imageUrl = imageUrl.trim();
    if (prerequisites !== undefined) existingEvent.prerequisites = prerequisites.trim();
    if (speakerInfo) existingEvent.speakerInfo = speakerInfo;
    if (tags) {
      existingEvent.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t: string) => t.trim())
        : existingEvent.tags;
    }

    if (startDate) existingEvent.startDate = new Date(startDate);
    if (endDate) existingEvent.endDate = new Date(endDate);
    if (registrationDeadline) existingEvent.registrationDeadline = new Date(registrationDeadline);

    if (existingEvent.endDate <= existingEvent.startDate) {
      res.status(400).json({
        success: false,
        error: { code: 'DATE_ORDER_ERROR', message: 'End date must be after start date.' },
      });
      return;
    }

    await existingEvent.save();

    res.json({
      success: true,
      message: 'Event updated successfully.',
      event: existingEvent,
    });
  } catch (error: any) {
    console.error('[Update Event Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'EVENT_UPDATE_FAILED', message: error.message || 'Failed to update event.' },
    });
  }
});

/**
 * DELETE /api/admin/events/:id
 * Sets status to 'cancelled' or deletes if 0 registrations
 */
adminEventsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid event identifier.' },
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
      });
      return;
    }

    // If there are confirmed participants, soft-cancel rather than hard deleting to preserve integrity
    if (event.confirmedRegistrationsCount > 0) {
      event.status = 'cancelled';
      await event.save();
      res.json({
        success: true,
        message: 'Event has active registrations and was marked as cancelled to preserve record integrity.',
        event,
      });
      return;
    }

    await Event.findByIdAndDelete(id);
    await Registration.deleteMany({ eventId: id });

    res.json({
      success: true,
      message: 'Event and associated records deleted permanently.',
    });
  } catch (error) {
    console.error('[Delete Event Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'EVENT_DELETE_FAILED', message: 'Failed to delete event.' },
    });
  }
});
