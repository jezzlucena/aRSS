import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Rss, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { ArticleList, ArticleView } from '@/components/articles';
import { AddFeedModal } from '@/components/feeds';
import { KeyboardShortcutsHelp } from '@/components/common';
import { SearchResults } from '@/components/search/SearchResults';
import { useFeeds, useCategories, useKeyboardNavigation } from '@/hooks';
import { useFeedStore } from '@/stores/feedStore';
import { useArticleStore } from '@/stores/articleStore';
import { useUIStore } from '@/stores/uiStore';
import type { ArticleWithState } from '@arss/types';

export function HomePage() {
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: feeds = [], isLoading: feedsLoading } = useFeeds();
  const { isLoading: categoriesLoading } = useCategories();
  const { selectedView, searchQuery } = useFeedStore();
  const { selectedArticleId, selectArticle } = useArticleStore();
  const { articleView } = useUIStore();

  const handleOpenArticle = useCallback((articleId: string) => {
    selectArticle(articleId);
  }, [selectArticle]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleShowHelp = useCallback(() => {
    setIsHelpOpen(true);
  }, []);

  // Enable keyboard navigation
  useKeyboardNavigation({
    enabled: true,
    onOpenArticle: handleOpenArticle,
    onFocusSearch: handleFocusSearch,
    onShowHelp: handleShowHelp,
  });

  const viewTitles: Record<string, string> = {
    all: 'All Articles',
    unread: 'Unread',
    saved: 'Saved',
    feed: 'Feed',
    category: 'Category',
    search: searchQuery ? `Search: "${searchQuery}"` : 'Search',
  };

  const handleSelectArticle = (article: ArticleWithState) => {
    selectArticle(article.id);
  };

  const handleCloseArticle = () => {
    selectArticle(null);
  };

  // Empty state - no feeds
  if (!feedsLoading && feeds.length === 0) {
    return (
      <>
        <div className="h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent-500/10 flex items-center justify-center">
              <Rss className="w-8 h-8 text-accent-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to aRSS</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by adding your first RSS feed. Stay updated with all your
              favorite content in one beautiful place.
            </p>
            <Button onClick={() => setIsAddFeedOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Your First Feed
            </Button>
          </motion.div>
        </div>

        <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
        <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
  }

  // Split view layout
  if (articleView === 'split') {
    return (
      <>
        <div className="h-full flex gap-6">
          {/* Article list */}
          <div className="w-1/2 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold truncate">{viewTitles[selectedView]}</h1>
              {selectedView !== 'search' && (
                <Button size="sm" onClick={() => setIsAddFeedOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Add Feed
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedView === 'search' ? (
                <SearchResults onSelectArticle={handleSelectArticle} />
              ) : (
                <ArticleList onSelectArticle={handleSelectArticle} />
              )}
            </div>
          </div>

          {/* Article view */}
          <div className="w-1/2 glass rounded-xl overflow-hidden">
            <ArticleView
              articleId={selectedArticleId}
              onClose={handleCloseArticle}
              mode="split"
            />
          </div>
        </div>

        <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
        <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
  }

  // Full/Overlay view layout
  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold truncate">{viewTitles[selectedView]}</h1>
          {selectedView !== 'search' && (
            <Button size="sm" onClick={() => setIsAddFeedOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Feed
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedView === 'search' ? (
            <SearchResults onSelectArticle={handleSelectArticle} />
          ) : (
            <ArticleList onSelectArticle={handleSelectArticle} />
          )}
        </div>
      </div>

      {/* Overlay article view */}
      {selectedArticleId && articleView === 'overlay' && (
        <ArticleView
          articleId={selectedArticleId}
          onClose={handleCloseArticle}
          mode="overlay"
        />
      )}

      <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
