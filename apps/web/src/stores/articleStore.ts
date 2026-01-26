import { create } from 'zustand';
import type { ArticleWithState } from '@arss/types';

interface ArticleState {
  articles: ArticleWithState[];
  selectedArticleId: string | null;
  isLoading: boolean;
  hasMore: boolean;
  setArticles: (articles: ArticleWithState[]) => void;
  appendArticles: (articles: ArticleWithState[]) => void;
  selectArticle: (articleId: string | null) => void;
  markAsRead: (articleId: string) => void;
  markAsUnread: (articleId: string) => void;
  toggleSaved: (articleId: string) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  clearArticles: () => void;
}

export const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  selectedArticleId: null,
  isLoading: false,
  hasMore: true,

  setArticles: (articles) => set({ articles }),

  appendArticles: (newArticles) =>
    set((state) => ({
      articles: [...state.articles, ...newArticles],
    })),

  selectArticle: (articleId) => set({ selectedArticleId: articleId }),

  markAsRead: (articleId) =>
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isRead: true } : a
      ),
    })),

  markAsUnread: (articleId) =>
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isRead: false } : a
      ),
    })),

  toggleSaved: (articleId) =>
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isSaved: !a.isSaved } : a
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setHasMore: (hasMore) => set({ hasMore }),

  clearArticles: () => set({ articles: [], selectedArticleId: null, hasMore: true }),
}));
