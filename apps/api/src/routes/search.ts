import { Router } from 'express';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as articleService from '../services/articleService.js';

const router = Router();

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  feedId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const suggestionsSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
});

type SearchQuery = z.infer<typeof searchSchema>;
type SuggestionsQuery = z.infer<typeof suggestionsSchema>;

// All routes require authentication
router.use(authenticate);

// GET /api/v1/search - Search articles with full-text search
router.get('/', validateQuery(searchSchema), async (req, res, next) => {
  try {
    const { q, page, limit, feedId, categoryId, startDate, endDate } = req.query as unknown as SearchQuery;

    const result = await articleService.searchArticles(req.user!.userId, q, page, limit);

    // If additional filters are provided, use getArticles with all filters
    if (feedId || categoryId || startDate || endDate) {
      const filteredResult = await articleService.getArticles(req.user!.userId, {
        search: q,
        feedId,
        categoryId,
        startDate,
        endDate,
        page,
        limit,
        sortBy: 'relevance',
        sortOrder: 'desc',
      });

      return res.json({
        success: true,
        data: filteredResult.articles,
        pagination: filteredResult.pagination,
      });
    }

    res.json({
      success: true,
      data: result.articles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/search/suggestions - Get search suggestions
router.get('/suggestions', validateQuery(suggestionsSchema), async (req, res, next) => {
  try {
    const { q } = req.query as unknown as SuggestionsQuery;

    const suggestions = await articleService.getSearchSuggestions(req.user!.userId, q);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
