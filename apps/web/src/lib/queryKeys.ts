import type { ArticleListParams } from '@arss/types';

/**
 * Centralized query key factory for React Query.
 * Using consistent keys ensures proper cache invalidation and prevents key collisions.
 */
export const queryKeys = {
  // Article queries
  articles: (params?: ArticleListParams) => ['articles', params] as const,
  article: (id: string) => ['article', id] as const,

  // Feed queries
  feeds: () => ['feeds'] as const,

  // Category queries
  categories: () => ['categories'] as const,

  // Unread count queries
  unreadCount: () => ['unread-count'] as const,
  unreadCountsByCategory: () => ['unread-counts-by-category'] as const,
  unreadCountsByFeed: () => ['unread-counts-by-feed'] as const,

  // Search queries
  search: (query: string) => ['search', query] as const,
  searchSuggestions: (query: string) => ['search-suggestions', query] as const,

  // Preference queries
  preferences: () => ['preferences'] as const,
} as const;

// Type helpers for better type safety
export type QueryKeys = typeof queryKeys;
export type ArticlesQueryKey = ReturnType<QueryKeys['articles']>;
export type ArticleQueryKey = ReturnType<QueryKeys['article']>;
