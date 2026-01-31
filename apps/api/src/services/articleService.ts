import { eq, and, desc, asc, sql, inArray, or, ilike, gte, lte } from 'drizzle-orm';
import { db, articles, userArticles, subscriptions, feeds } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

export interface ArticleFilters {
  feedId?: string;
  categoryId?: string;
  isRead?: boolean;
  isSaved?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ArticleListParams extends ArticleFilters {
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get feed IDs for a user based on optional feedId or categoryId filters.
 * If feedId is provided, verifies subscription and returns that single feed.
 * If categoryId is provided, returns all feeds in that category.
 * Otherwise, returns all subscribed feeds for the user.
 */
async function getUserFeedIds(
  userId: string,
  feedId?: string,
  categoryId?: string
): Promise<string[]> {
  if (feedId) {
    // Verify user is subscribed to this feed
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.feedId, feedId)
      ),
    });

    if (!subscription) {
      throw new AppError(404, 'Feed not found');
    }

    return [feedId];
  }

  if (categoryId) {
    // Get all feeds in category
    const categorySubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.categoryId, categoryId)
      ),
    });

    return categorySubscriptions.map((s) => s.feedId);
  }

  // Get all subscribed feeds
  const userSubscriptions = await db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
  });

  return userSubscriptions.map((s) => s.feedId);
}

export async function getArticles(userId: string, params: ArticleListParams) {
  const {
    feedId,
    categoryId,
    isRead,
    isSaved,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = params;

  // Get user's subscribed feed IDs
  let feedIds: string[];
  try {
    feedIds = await getUserFeedIds(userId, feedId, categoryId);
  } catch (error) {
    // Re-throw AppError (e.g., feed not found), but handle edge case
    if (error instanceof AppError) throw error;
    feedIds = [];
  }

  if (feedIds.length === 0) {
    return {
      articles: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Build query conditions
  const conditions = [inArray(articles.feedId, feedIds)];

  // Date range filtering
  if (startDate) {
    conditions.push(gte(articles.publishedAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(articles.publishedAt, new Date(endDate)));
  }

  // Full-text search using PostgreSQL tsvector
  let useFullTextSearch = false;
  let searchQuery = '';

  if (search && search.trim()) {
    searchQuery = search.trim();
    useFullTextSearch = true;

    // Convert search terms to tsquery format
    // Handle quoted phrases and multiple terms
    const tsQuery = searchQuery
      .replace(/"/g, '') // Remove quotes for now
      .split(/\s+/)
      .filter(Boolean)
      .join(' & '); // AND search terms together

    conditions.push(
      sql`search_tsvector @@ plainto_tsquery('english', ${searchQuery})`
    );
  }

  // Determine sort order
  let orderByClause;

  if (useFullTextSearch && sortBy === 'relevance') {
    // Sort by relevance score when searching
    orderByClause = sql`ts_rank(search_tsvector, plainto_tsquery('english', ${searchQuery})) DESC`;
  } else {
    const orderColumn = sortBy === 'publishedAt' || sortBy === 'relevance'
      ? articles.publishedAt
      : articles.createdAt;
    const orderDirection = sortOrder === 'asc' ? asc : desc;
    orderByClause = orderDirection(orderColumn);
  }

  // Build the base query with joins for filtering by read/saved state
  // We need to join userArticles to filter in SQL, not in JS
  const baseQuery = db
    .select({
      article: articles,
      feed: feeds,
      userState: userArticles,
      subscription: subscriptions,
      ...(useFullTextSearch ? {
        relevance: sql<number>`ts_rank(search_tsvector, plainto_tsquery('english', ${searchQuery}))`,
      } : {}),
    })
    .from(articles)
    .innerJoin(feeds, eq(articles.feedId, feeds.id))
    .innerJoin(
      subscriptions,
      and(
        eq(subscriptions.feedId, feeds.id),
        eq(subscriptions.userId, userId)
      )
    )
    .leftJoin(
      userArticles,
      and(
        eq(userArticles.articleId, articles.id),
        eq(userArticles.userId, userId)
      )
    );

  // Build read/saved conditions
  const readSavedConditions = [...conditions];

  // Filter by read state in SQL
  if (isRead !== undefined) {
    if (isRead) {
      // Only read articles (userArticles.isRead = true)
      readSavedConditions.push(eq(userArticles.isRead, true));
    } else {
      // Only unread articles (no userArticles entry OR isRead = false)
      readSavedConditions.push(
        or(
          sql`${userArticles.isRead} IS NULL`,
          eq(userArticles.isRead, false)
        )!
      );
    }
  }

  // Filter by saved state in SQL
  if (isSaved !== undefined && isSaved) {
    readSavedConditions.push(eq(userArticles.isSaved, true));
  }

  // Get total count with all filters applied
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .leftJoin(
      userArticles,
      and(
        eq(userArticles.articleId, articles.id),
        eq(userArticles.userId, userId)
      )
    )
    .where(and(...readSavedConditions));

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Get articles with all filters applied in SQL
  const articleList = await baseQuery
    .where(and(...readSavedConditions))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // Map to response format
  const result = articleList.map(({ article, feed, userState, subscription }) => ({
    ...article,
    feed: {
      id: feed.id,
      title: subscription?.customTitle || feed.title,
      iconUrl: feed.iconUrl,
      siteUrl: feed.siteUrl,
    },
    isRead: userState?.isRead ?? false,
    isSaved: userState?.isSaved ?? false,
  }));

  return {
    articles: result,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getArticle(userId: string, articleId: string) {
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
    with: {
      feed: true,
    },
  });

  if (!article) {
    throw new AppError(404, 'Article not found');
  }

  // Verify user has access to this article
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.feedId, article.feedId)
    ),
  });

  if (!subscription) {
    throw new AppError(404, 'Article not found');
  }

  // Get user state
  const userState = await db.query.userArticles.findFirst({
    where: and(
      eq(userArticles.userId, userId),
      eq(userArticles.articleId, articleId)
    ),
  });

  return {
    ...article,
    feed: {
      ...article.feed,
      title: subscription.customTitle || article.feed.title,
    },
    isRead: userState?.isRead ?? false,
    isSaved: userState?.isSaved ?? false,
  };
}

export async function markAsRead(userId: string, articleId: string) {
  await upsertUserArticle(userId, articleId, { isRead: true, readAt: new Date() });
}

export async function markAsUnread(userId: string, articleId: string) {
  await upsertUserArticle(userId, articleId, { isRead: false, readAt: null });
}

export async function toggleSaved(userId: string, articleId: string) {
  const existing = await db.query.userArticles.findFirst({
    where: and(
      eq(userArticles.userId, userId),
      eq(userArticles.articleId, articleId)
    ),
  });

  const isSaved = !existing?.isSaved;
  await upsertUserArticle(userId, articleId, {
    isSaved,
    savedAt: isSaved ? new Date() : null,
  });

  return { isSaved };
}

export async function setSaved(userId: string, articleId: string, isSaved: boolean) {
  await upsertUserArticle(userId, articleId, {
    isSaved,
    savedAt: isSaved ? new Date() : null,
  });
}

export async function markBulkAsRead(
  userId: string,
  articleIds?: string[],
  feedId?: string,
  categoryId?: string,
  olderThanHours?: number
) {
  let targetIds = articleIds;

  if (!targetIds) {
    // Get all articles from feed or category using utility
    let feedIds: string[];
    try {
      feedIds = await getUserFeedIds(userId, feedId, categoryId);
    } catch {
      feedIds = [];
    }

    if (feedIds.length === 0) return { count: 0 };

    // Build conditions for article query
    const conditions = [inArray(articles.feedId, feedIds)];

    // Add date filter if provided - mark articles older than X hours ago (using server time)
    if (olderThanHours !== undefined && olderThanHours > 0) {
      const olderThan = new Date();
      olderThan.setHours(olderThan.getHours() - olderThanHours);
      conditions.push(lte(articles.publishedAt, olderThan));
    }

    const articlesList = await db
      .select({ id: articles.id })
      .from(articles)
      .where(and(...conditions));

    targetIds = articlesList.map((a) => a.id);
  }

  if (targetIds.length === 0) return { count: 0 };

  // Upsert all articles as read
  const now = new Date();
  const values = targetIds.map((articleId) => ({
    userId,
    articleId,
    isRead: true,
    isSaved: false,
    readAt: now,
    savedAt: null,
  }));

  await db
    .insert(userArticles)
    .values(values)
    .onConflictDoUpdate({
      target: [userArticles.userId, userArticles.articleId],
      set: {
        isRead: true,
        readAt: now,
      },
    });

  return { count: targetIds.length };
}

async function upsertUserArticle(
  userId: string,
  articleId: string,
  updates: {
    isRead?: boolean;
    isSaved?: boolean;
    readAt?: Date | null;
    savedAt?: Date | null;
  }
) {
  const existing = await db.query.userArticles.findFirst({
    where: and(
      eq(userArticles.userId, userId),
      eq(userArticles.articleId, articleId)
    ),
  });

  if (existing) {
    await db
      .update(userArticles)
      .set(updates)
      .where(
        and(
          eq(userArticles.userId, userId),
          eq(userArticles.articleId, articleId)
        )
      );
  } else {
    await db.insert(userArticles).values({
      userId,
      articleId,
      isRead: updates.isRead ?? false,
      isSaved: updates.isSaved ?? false,
      readAt: updates.readAt ?? null,
      savedAt: updates.savedAt ?? null,
    });
  }
}

export async function getSearchSuggestions(userId: string, query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  // Get user's subscribed feed IDs
  const feedIds = await getUserFeedIds(userId);

  if (feedIds.length === 0) {
    return [];
  }

  // Search for matching article titles using ILIKE for partial matching
  // This is more forgiving than trigram similarity for autocomplete
  const suggestions = await db
    .select({
      title: articles.title,
    })
    .from(articles)
    .where(
      and(
        inArray(articles.feedId, feedIds),
        sql`title ILIKE ${'%' + query + '%'}`
      )
    )
    .orderBy(articles.publishedAt)
    .limit(10);

  // Extract unique search terms from titles
  const seen = new Set<string>();
  const results: Array<{ title: string; type: 'article' }> = [];

  for (const { title } of suggestions) {
    if (!seen.has(title.toLowerCase())) {
      seen.add(title.toLowerCase());
      results.push({ title, type: 'article' });
    }
    if (results.length >= 5) break;
  }

  return results;
}

export async function searchArticles(userId: string, query: string, page = 1, limit = 20) {
  if (!query || query.trim().length === 0) {
    return {
      articles: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  return getArticles(userId, {
    search: query,
    page,
    limit,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
}

export async function getUnreadCount(userId: string) {
  // Get user's subscribed feed IDs
  const feedIds = await getUserFeedIds(userId);

  if (feedIds.length === 0) {
    return { count: 0 };
  }

  // Count articles that are not marked as read
  // An article is unread if there's no userArticles entry or isRead is false
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .leftJoin(
      userArticles,
      and(
        eq(userArticles.articleId, articles.id),
        eq(userArticles.userId, userId)
      )
    )
    .where(
      and(
        inArray(articles.feedId, feedIds),
        or(
          sql`${userArticles.isRead} IS NULL`,
          eq(userArticles.isRead, false)
        )
      )
    );

  return { count: result[0]?.count || 0 };
}

export async function getUnreadCountsByCategory(userId: string) {
  // Get user's subscriptions with category info
  const userSubscriptions = await db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
  });

  if (userSubscriptions.length === 0) {
    return { counts: {} };
  }

  // Group feed IDs by category
  const feedsByCategory = new Map<string, string[]>();
  for (const sub of userSubscriptions) {
    if (sub.categoryId) {
      const feeds = feedsByCategory.get(sub.categoryId) || [];
      feeds.push(sub.feedId);
      feedsByCategory.set(sub.categoryId, feeds);
    }
  }

  if (feedsByCategory.size === 0) {
    return { counts: {} };
  }

  // Get unread counts for each category
  const counts: Record<string, number> = {};

  for (const [categoryId, feedIds] of feedsByCategory) {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .leftJoin(
        userArticles,
        and(
          eq(userArticles.articleId, articles.id),
          eq(userArticles.userId, userId)
        )
      )
      .where(
        and(
          inArray(articles.feedId, feedIds),
          or(
            sql`${userArticles.isRead} IS NULL`,
            eq(userArticles.isRead, false)
          )
        )
      );

    counts[categoryId] = result[0]?.count || 0;
  }

  return { counts };
}

export async function getUnreadCountsByFeed(userId: string) {
  // Get user's subscribed feed IDs
  const feedIds = await getUserFeedIds(userId);

  if (feedIds.length === 0) {
    return { counts: {} };
  }

  // Get unread counts grouped by feed
  const result = await db
    .select({
      feedId: articles.feedId,
      count: sql<number>`count(*)::int`,
    })
    .from(articles)
    .leftJoin(
      userArticles,
      and(
        eq(userArticles.articleId, articles.id),
        eq(userArticles.userId, userId)
      )
    )
    .where(
      and(
        inArray(articles.feedId, feedIds),
        or(
          sql`${userArticles.isRead} IS NULL`,
          eq(userArticles.isRead, false)
        )
      )
    )
    .groupBy(articles.feedId);

  const counts: Record<string, number> = {};
  for (const row of result) {
    counts[row.feedId] = row.count;
  }

  return { counts };
}
