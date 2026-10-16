import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event.ts';

export const publicEventsRouter = Router();

/**
 * GET /api/events
 * Query params: q, category, status, format, sort, page, limit
 */
publicEventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      status,
      format,
      sort = 'date_asc',
      page = '1',
      limit = '9',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: Record<string, any> = {};

    // By default, public listing only shows upcoming and ongoing events unless explicit
    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    } else if (!status) {
      filter.status = { $in: ['upcoming', 'ongoing'] };
    }

    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = category;
    }

    if (format && typeof format === 'string' && format !== 'all') {
      filter.format = format;
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { venue: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Build sort
    let sortObj: Record<string, any> = { startDate: 1 };
    if (sort === 'date_desc') {
      sortObj = { startDate: -1 };
    } else if (sort === 'title_asc') {
      sortObj = { title: 1 };
    } else if (sort === 'capacity') {
      sortObj = { maxCapacity: -1 };
    }

    const [events, total] = await Promise.all([
      Event.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(filter),
    ]);

    const formattedEvents = events.map((event: any) => {
      const remainingCapacity = Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0));
      const isFull = remainingCapacity <= 0;
      const isPastDeadline = new Date() > new Date(event.registrationDeadline);
      const isRegistrationOpen =
        (event.status === 'upcoming' || event.status === 'ongoing') && !isFull && !isPastDeadline;

      return {
        ...event,
        remainingCapacity,
        isFull,
        isPastDeadline,
        isRegistrationOpen,
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
    console.error('[Public Events API Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'EVENTS_FETCH_ERROR', message: 'Unable to retrieve events.' },
    });
  }
});

/**
 * GET /api/categories
 * Returns all categories with event counts
 */
publicEventsRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: { $in: ['upcoming', 'ongoing'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      categories: categories.map((c) => ({ category: c._id, count: c.count })),
    });
  } catch (error) {
    console.error('[Categories API Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'CATEGORIES_FETCH_ERROR', message: 'Unable to retrieve categories.' },
    });
  }
});

/**
 * GET /api/events/:id
 * Single event detailed view
 */
publicEventsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found with this identifier.' },
      });
      return;
    }

    const event = await Event.findById(id).lean() as any;
    if (!event) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
      });
      return;
    }

    const remainingCapacity = Math.max(0, event.maxCapacity - (event.confirmedRegistrationsCount || 0));
    const isFull = remainingCapacity <= 0;
    const isPastDeadline = new Date() > new Date(event.registrationDeadline);
    const isRegistrationOpen =
      (event.status === 'upcoming' || event.status === 'ongoing') && !isFull && !isPastDeadline;

    res.json({
      success: true,
      event: {
        ...event,
        remainingCapacity,
        isFull,
        isPastDeadline,
        isRegistrationOpen,
      },
    });
  } catch (error) {
    console.error('[Event Details API Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'EVENT_FETCH_ERROR', message: 'Unable to retrieve event details.' },
    });
  }
});
