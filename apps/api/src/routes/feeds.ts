import { Router } from 'express';
import { z } from 'zod';
import { validate, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as feedService from '../services/feedService.js';

const router = Router();

const addFeedSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  categoryId: z.string().uuid().optional(),
});

const updateSubscriptionSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  customTitle: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

const feedIdSchema = z.object({
  id: z.string().uuid('Invalid feed ID'),
});

type FeedIdParams = z.infer<typeof feedIdSchema>;

// All routes require authentication
router.use(authenticate);

// GET /api/v1/feeds - Get user's subscribed feeds
router.get('/', async (req, res, next) => {
  try {
    const feeds = await feedService.getUserFeeds(req.user!.userId);
    res.json({
      success: true,
      data: feeds,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/feeds - Subscribe to a new feed
router.post('/', validate(addFeedSchema), async (req, res, next) => {
  try {
    const subscription = await feedService.addFeed(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/feeds/discover - Discover feed info without subscribing
router.post('/discover', validate(z.object({ url: z.string().min(1) })), async (req, res, next) => {
  try {
    const feedInfo = await feedService.discoverFeed(req.body.url);
    res.json({
      success: true,
      data: feedInfo,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/feeds/:id - Get feed details
router.get('/:id', validateParams(feedIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as FeedIdParams;
    const feed = await feedService.getFeed(id);
    res.json({
      success: true,
      data: feed,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/feeds/:id - Update subscription
router.patch(
  '/:id',
  validateParams(feedIdSchema),
  validate(updateSubscriptionSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as FeedIdParams;
      const subscription = await feedService.updateSubscription(
        req.user!.userId,
        id,
        req.body
      );
      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/feeds/:id - Unsubscribe from feed
router.delete('/:id', validateParams(feedIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as FeedIdParams;
    await feedService.deleteFeed(req.user!.userId, id);
    res.json({
      success: true,
      message: 'Unsubscribed from feed',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/feeds/:id/refresh - Refresh feed articles
router.post('/:id/refresh', validateParams(feedIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as FeedIdParams;
    const feed = await feedService.refreshFeed(id);
    res.json({
      success: true,
      data: feed,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
