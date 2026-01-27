import { Router } from 'express';
import { z } from 'zod';
import { validate, validateParams, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as articleService from '../services/articleService.js';

const router = Router();

const articleListSchema = z.object({
  feedId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  isRead: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  isSaved: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  sortBy: z.enum(['publishedAt', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const articleIdSchema = z.object({
  id: z.string().uuid('Invalid article ID'),
});

const updateArticleSchema = z.object({
  isRead: z.boolean().optional(),
  isSaved: z.boolean().optional(),
});

const markBulkReadSchema = z.object({
  articleIds: z.array(z.string().uuid()).optional(),
  feedId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  olderThan: z.string().datetime().optional(),
});

type ArticleIdParams = z.infer<typeof articleIdSchema>;

// All routes require authentication
router.use(authenticate);

// GET /api/v1/articles - Get articles
router.get('/', validateQuery(articleListSchema), async (req, res, next) => {
  try {
    const result = await articleService.getArticles(req.user!.userId, req.query as unknown as articleService.ArticleListParams);
    res.json({
      success: true,
      data: result.articles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/articles/unread-count - Get unread article count
// NOTE: This must come before /:id route
router.get('/unread-count', async (req, res, next) => {
  try {
    const result = await articleService.getUnreadCount(req.user!.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/articles/unread-counts-by-category - Get unread counts per category
// NOTE: This must come before /:id route
router.get('/unread-counts-by-category', async (req, res, next) => {
  try {
    const result = await articleService.getUnreadCountsByCategory(req.user!.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/articles/unread-counts-by-feed - Get unread counts per feed
// NOTE: This must come before /:id route
router.get('/unread-counts-by-feed', async (req, res, next) => {
  try {
    const result = await articleService.getUnreadCountsByFeed(req.user!.userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/articles/:id - Get single article
router.get('/:id', validateParams(articleIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as ArticleIdParams;
    const article = await articleService.getArticle(req.user!.userId, id);
    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/articles/:id - Update article state (read/saved)
router.patch(
  '/:id',
  validateParams(articleIdSchema),
  validate(updateArticleSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as ArticleIdParams;
      const { isRead, isSaved } = req.body;

      if (isRead !== undefined) {
        if (isRead) {
          await articleService.markAsRead(req.user!.userId, id);
        } else {
          await articleService.markAsUnread(req.user!.userId, id);
        }
      }

      if (isSaved !== undefined) {
        const result = await articleService.toggleSaved(req.user!.userId, id);
        // Only return the toggle result if it was actually requested
        if (isSaved !== result.isSaved) {
          await articleService.toggleSaved(req.user!.userId, id);
        }
      }

      const article = await articleService.getArticle(req.user!.userId, id);
      res.json({
        success: true,
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/articles/mark-read - Mark multiple articles as read
router.post('/mark-read', validate(markBulkReadSchema), async (req, res, next) => {
  try {
    const result = await articleService.markBulkAsRead(
      req.user!.userId,
      req.body.articleIds,
      req.body.feedId,
      req.body.categoryId,
      req.body.olderThan ? new Date(req.body.olderThan) : undefined
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
