import { create } from 'zustand';
import type { Category, Feed, SubscriptionWithFeed } from '@arss/types';

interface FeedState {
  feeds: SubscriptionWithFeed[];
  categories: Category[];
  selectedFeedId: string | null;
  selectedCategoryId: string | null;
  selectedView: 'all' | 'unread' | 'saved' | 'feed' | 'category' | 'search';
  searchQuery: string | null;
  setFeeds: (feeds: SubscriptionWithFeed[]) => void;
  setCategories: (categories: Category[]) => void;
  selectFeed: (feedId: string | null) => void;
  selectCategory: (categoryId: string | null) => void;
  setView: (view: FeedState['selectedView']) => void;
  setSearchQuery: (query: string | null) => void;
  addFeed: (feed: SubscriptionWithFeed) => void;
  removeFeed: (feedId: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  removeCategory: (categoryId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feeds: [],
  categories: [],
  selectedFeedId: null,
  selectedCategoryId: null,
  selectedView: 'all',
  searchQuery: null,

  setFeeds: (feeds) => set({ feeds }),

  setCategories: (categories) => set({ categories }),

  selectFeed: (feedId) =>
    set({
      selectedFeedId: feedId,
      selectedCategoryId: null,
      selectedView: feedId ? 'feed' : 'all',
      searchQuery: null,
    }),

  selectCategory: (categoryId) =>
    set({
      selectedCategoryId: categoryId,
      selectedFeedId: null,
      selectedView: categoryId ? 'category' : 'all',
      searchQuery: null,
    }),

  setView: (view) =>
    set({
      selectedView: view,
      selectedFeedId: view === 'feed' ? undefined : null,
      selectedCategoryId: view === 'category' ? undefined : null,
      searchQuery: view === 'search' ? undefined : null,
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
      selectedView: query ? 'search' : 'all',
      selectedFeedId: null,
      selectedCategoryId: null,
    }),

  addFeed: (feed) => set((state) => ({ feeds: [...state.feeds, feed] })),

  removeFeed: (feedId) =>
    set((state) => ({
      feeds: state.feeds.filter((f) => f.feedId !== feedId),
      selectedFeedId: state.selectedFeedId === feedId ? null : state.selectedFeedId,
    })),

  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),

  updateCategory: (categoryId, updates) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c
      ),
    })),

  removeCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
      selectedCategoryId:
        state.selectedCategoryId === categoryId ? null : state.selectedCategoryId,
    })),
}));
