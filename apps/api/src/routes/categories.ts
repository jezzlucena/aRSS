import { Router } from 'express';
import { z } from 'zod';
import { validate, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as categoryService from '../services/categoryService.js';

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional(),
  parentId: z.string().uuid().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional(),
  parentId: z.string().uuid().nullable().optional(),
  order: z.number().int().optional(),
});

const categoryIdSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

type CategoryIdParams = z.infer<typeof categoryIdSchema>;

// All routes require authentication
router.use(authenticate);

// GET /api/v1/categories - Get user's categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await categoryService.getUserCategories(req.user!.userId);
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/categories - Create a new category
router.post('/', validate(createCategorySchema), async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/categories/:id - Get category details
router.get('/:id', validateParams(categoryIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as CategoryIdParams;
    const category = await categoryService.getCategory(req.user!.userId, id);
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/categories/:id - Update category
router.patch(
  '/:id',
  validateParams(categoryIdSchema),
  validate(updateCategorySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as CategoryIdParams;
      const category = await categoryService.updateCategory(
        req.user!.userId,
        id,
        req.body
      );
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', validateParams(categoryIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as CategoryIdParams;
    await categoryService.deleteCategory(req.user!.userId, id);
    res.json({
      success: true,
      message: 'Category deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
