import { eq, and, isNull } from 'drizzle-orm';
import { db, categories, subscriptions, NewCategory } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateRandomColor } from '@arss/utils';

export interface CreateCategoryInput {
  name: string;
  color?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  parentId?: string | null;
  order?: number;
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  // Validate parent exists if provided
  if (input.parentId) {
    const parent = await db.query.categories.findFirst({
      where: and(
        eq(categories.id, input.parentId),
        eq(categories.userId, userId)
      ),
    });

    if (!parent) {
      throw new AppError(404, 'Parent category not found');
    }
  }

  // Get max order for positioning
  const existingCategories = await db.query.categories.findMany({
    where: and(
      eq(categories.userId, userId),
      input.parentId
        ? eq(categories.parentId, input.parentId)
        : isNull(categories.parentId)
    ),
  });

  const maxOrder = Math.max(0, ...existingCategories.map((c) => c.order));

  const [category] = await db
    .insert(categories)
    .values({
      userId,
      name: input.name,
      color: input.color || generateRandomColor(),
      parentId: input.parentId || null,
      order: maxOrder + 1,
    })
    .returning();

  return category;
}

export async function getUserCategories(userId: string) {
  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: [categories.order],
  });

  // Build tree structure
  return buildCategoryTree(userCategories);
}

export async function getCategory(userId: string, categoryId: string) {
  const category = await db.query.categories.findFirst({
    where: and(
      eq(categories.id, categoryId),
      eq(categories.userId, userId)
    ),
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
) {
  const category = await getCategory(userId, categoryId);

  // Validate parent if being changed
  if (input.parentId !== undefined && input.parentId !== null) {
    // Can't set self as parent
    if (input.parentId === categoryId) {
      throw new AppError(400, 'Category cannot be its own parent');
    }

    // Check parent exists
    const parent = await db.query.categories.findFirst({
      where: and(
        eq(categories.id, input.parentId),
        eq(categories.userId, userId)
      ),
    });

    if (!parent) {
      throw new AppError(404, 'Parent category not found');
    }

    // Prevent circular references
    const descendants = await getDescendants(userId, categoryId);
    if (descendants.some((d) => d.id === input.parentId)) {
      throw new AppError(400, 'Cannot create circular category reference');
    }
  }

  const [updated] = await db
    .update(categories)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, categoryId))
    .returning();

  return updated;
}

export async function deleteCategory(userId: string, categoryId: string) {
  await getCategory(userId, categoryId);

  // Move all subscriptions in this category to uncategorized
  await db
    .update(subscriptions)
    .set({ categoryId: null })
    .where(eq(subscriptions.categoryId, categoryId));

  // Move child categories to parent level
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (category) {
    await db
      .update(categories)
      .set({ parentId: category.parentId })
      .where(eq(categories.parentId, categoryId));
  }

  // Delete the category
  await db.delete(categories).where(eq(categories.id, categoryId));
}

async function getDescendants(userId: string, categoryId: string) {
  const allCategories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
  });

  const descendants: typeof allCategories = [];
  const toProcess = [categoryId];

  while (toProcess.length > 0) {
    const currentId = toProcess.pop()!;
    const children = allCategories.filter((c) => c.parentId === currentId);
    descendants.push(...children);
    toProcess.push(...children.map((c) => c.id));
  }

  return descendants;
}

interface CategoryWithChildren {
  id: string;
  userId: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryWithChildren[];
}

function buildCategoryTree(
  flatCategories: {
    id: string;
    userId: string;
    name: string;
    color: string;
    parentId: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }[]
): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>();

  // First pass: create all nodes with empty children arrays
  for (const cat of flatCategories) {
    categoryMap.set(cat.id, { ...cat, children: [] });
  }

  // Second pass: build the tree
  const roots: CategoryWithChildren[] = [];

  for (const cat of flatCategories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by order at each level
  const sortByOrder = (a: CategoryWithChildren, b: CategoryWithChildren) =>
    a.order - b.order;

  const sortRecursive = (cats: CategoryWithChildren[]) => {
    cats.sort(sortByOrder);
    for (const cat of cats) {
      sortRecursive(cat.children);
    }
  };

  sortRecursive(roots);

  return roots;
}
