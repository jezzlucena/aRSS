import { useEffect } from 'react';
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useArticleStore } from '@/stores/articleStore';
import { toast } from '@/stores/toastStore';
import type { ArticleWithState, ArticleListParams, PaginatedResponse } from '@arss/types';

export function useArticles(params: ArticleListParams = {}) {
  const { setArticles, setHasMore } = useArticleStore();

  const query = useInfiniteQuery({
    queryKey: ['articles', params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(pageParam));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.feedId) searchParams.set('feedId', params.feedId);
      if (params.categoryId) searchParams.set('categoryId', params.categoryId);
      if (params.isRead !== undefined) searchParams.set('isRead', String(params.isRead));
      if (params.isSaved !== undefined) searchParams.set('isSaved', String(params.isSaved));
      if (params.search) searchParams.set('search', params.search);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await api.get<PaginatedResponse<ArticleWithState>>(`/articles?${searchParams}`);
      return {
        articles: response.data.data || [],
        pagination: response.data.pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if (query.data) {
      const allArticles = query.data.pages.flatMap((page) => page.articles);
      setArticles(allArticles);
      const lastPage = query.data.pages[query.data.pages.length - 1];
      setHasMore(lastPage.pagination.page < lastPage.pagination.totalPages);
    }
  }, [query.data, setArticles, setHasMore]);

  return query;
}

export function useArticle(articleId: string | null) {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ArticleWithState }>(`/articles/${articleId}`);
      return response.data.data;
    },
    enabled: !!articleId,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { markAsRead } = useArticleStore();

  return useMutation({
    mutationFn: async (articleId: string) => {
      await api.patch(`/articles/${articleId}`, { isRead: true });
      return articleId;
    },
    onMutate: (articleId) => {
      markAsRead(articleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: () => {
      toast.error('Failed to mark article as read');
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();
  const { markAsUnread } = useArticleStore();

  return useMutation({
    mutationFn: async (articleId: string) => {
      await api.patch(`/articles/${articleId}`, { isRead: false });
      return articleId;
    },
    onMutate: (articleId) => {
      markAsUnread(articleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useToggleSaved() {
  const queryClient = useQueryClient();
  const { toggleSaved, articles } = useArticleStore();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const article = articles.find((a) => a.id === articleId);
      const newSavedState = article ? !article.isSaved : true;
      await api.patch(`/articles/${articleId}`, { isSaved: newSavedState });
      return { articleId, isSaved: newSavedState };
    },
    onMutate: (articleId) => {
      toggleSaved(articleId);
    },
    onSuccess: ({ isSaved }) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(isSaved ? 'Article saved' : 'Article removed from saved');
    },
    onError: () => {
      toast.error('Failed to update saved status');
    },
  });
}

export function useMarkBulkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { articleIds?: string[]; feedId?: string; categoryId?: string }) => {
      const response = await api.post<{ success: boolean; data: { count: number } }>('/articles/mark-read', params);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<ArticleWithState>>(`/search?q=${encodeURIComponent(query)}`);
      return {
        articles: response.data.data || [],
        pagination: response.data.pagination,
      };
    },
    enabled: query.length > 0,
  });
}
