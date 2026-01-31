import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Rss, Plus, ClockArrowDown, ClockArrowUp, CheckCheck, Smartphone } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui';
import { ArticleList, ArticleView } from '@/components/articles';
import { AddFeedModal } from '@/components/feeds';
import { KeyboardShortcutsHelp } from '@/components/common';
import { SearchResults } from '@/components/search/SearchResults';
import { useFeeds, useCategories, useKeyboardNavigation, useMarkBulkAsRead } from '@/hooks';
import { useFeedStore } from '@/stores/feedStore';
import { useArticleStore } from '@/stores/articleStore';
import { useUIStore } from '@/stores/uiStore';
import { toast } from '@/stores/toastStore';
import type { ArticleWithState } from '@arss/types';

type SortOrder = 'newest' | 'oldest';

// Reusable dropdown component for "Mark as Read" actions
interface MarkAsReadDropdownProps {
  onMarkAll: () => void;
  onMarkPast1Day: () => void;
  onMarkPast7Days: () => void;
}

function MarkAsReadDropdown({ onMarkAll, onMarkPast1Day, onMarkPast7Days }: MarkAsReadDropdownProps) {
  const { t } = useTranslation('articles');
  const title = t('markAllAsRead.title');

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          title={title}
        >
          <CheckCheck className="w-4 h-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] glass rounded-lg p-1 shadow-lg animate-fade-in z-50 border border-gray-400/50"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none pointer-events-none"
          >
            {title}
          </DropdownMenu.Item>
          <hr className="my-1" />
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
            onSelect={onMarkAll}
          >
            {t('markAllAsRead.all')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
            onSelect={onMarkPast1Day}
          >
            {t('markAllAsRead.past1Day')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
            onSelect={onMarkPast7Days}
          >
            {t('markAllAsRead.past7Days')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// Reusable header component for article list views
interface ArticleListHeaderProps {
  title: string;
  showControls: boolean;
  sortOrder: SortOrder;
  onToggleSort: () => void;
  onMarkAllAsRead: () => void;
  onMarkPast1DayAsRead: () => void;
  onMarkPast7DaysAsRead: () => void;
  className?: string;
}

function ArticleListHeader({
  title,
  showControls,
  sortOrder,
  onToggleSort,
  onMarkAllAsRead,
  onMarkPast1DayAsRead,
  onMarkPast7DaysAsRead,
  className = 'mb-4',
}: ArticleListHeaderProps) {
  const { t } = useTranslation('articles');

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h1 className="text-2xl font-bold truncate">{title}</h1>
      {showControls && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSort}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {sortOrder === 'newest' ? (
              <ClockArrowUp className="w-4 h-4" />
            ) : (
              <ClockArrowDown className="w-4 h-4" />
            )}
            {sortOrder === 'newest' ? t('sort.newestFirst') : t('sort.oldestFirst')}
          </Button>
          <MarkAsReadDropdown
            onMarkAll={onMarkAllAsRead}
            onMarkPast1Day={onMarkPast1DayAsRead}
            onMarkPast7Days={onMarkPast7DaysAsRead}
          />
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation('navigation');
  const { t: tArticles } = useTranslation('articles');
  const { t: tSettings } = useTranslation('settings');
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isPortrait, setIsPortrait] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  const { data: feeds = [], isLoading: feedsLoading } = useFeeds();
  const { isLoading: categoriesLoading } = useCategories();
  const { selectedView, searchQuery, selectedFeedId, selectedCategoryId, categories } = useFeedStore();
  const markBulkAsRead = useMarkBulkAsRead();

  const handleMarkAllAsRead = useCallback(() => {
    markBulkAsRead.mutate(
      {
        feedId: selectedFeedId ?? undefined,
        categoryId: selectedCategoryId ?? undefined,
      },
      {
        onSuccess: (data) => {
          toast.success(tArticles('markAllAsRead.success', { count: data.count }));
        },
      }
    );
  }, [markBulkAsRead, selectedFeedId, selectedCategoryId, tArticles]);

  const handleMarkPast1DayAsRead = useCallback(() => {
    markBulkAsRead.mutate(
      {
        feedId: selectedFeedId ?? undefined,
        categoryId: selectedCategoryId ?? undefined,
        olderThanHours: 24,
      },
      {
        onSuccess: (data) => {
          toast.success(tArticles('markAllAsRead.success', { count: data.count }));
        },
      }
    );
  }, [markBulkAsRead, selectedFeedId, selectedCategoryId, tArticles]);

  const handleMarkPast7DaysAsRead = useCallback(() => {
    markBulkAsRead.mutate(
      {
        feedId: selectedFeedId ?? undefined,
        categoryId: selectedCategoryId ?? undefined,
        olderThanHours: 24 * 7,
      },
      {
        onSuccess: (data) => {
          toast.success(tArticles('markAllAsRead.success', { count: data.count }));
        },
      }
    );
  }, [markBulkAsRead, selectedFeedId, selectedCategoryId, tArticles]);
  const { selectedArticleId, selectArticle } = useArticleStore();
  const { articleView, splitPosition, setSplitPosition } = useUIStore();
  const [isDragging, setIsDragging] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

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

  // Find selected feed and category names
  const selectedFeed = feeds.find((f) => f.feedId === selectedFeedId);
  const selectedFeedName = selectedFeed?.customTitle || selectedFeed?.feed.title || 'Feed';

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedCategoryName = selectedCategory?.name || 'Category';

  const viewTitles: Record<string, string> = {
    all: t('viewTitles.all'),
    unread: t('viewTitles.unread'),
    saved: t('viewTitles.saved'),
    feed: selectedFeedName,
    category: selectedCategoryName,
    search: searchQuery ? t('viewTitles.searchQuery', { query: searchQuery }) : t('viewTitles.search'),
  };

  const handleSelectArticle = (article: ArticleWithState) => {
    selectArticle(article.id);
  };

  const handleCloseArticle = () => {
    selectArticle(null);
  };

  // Handle split pane dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !splitContainerRef.current) return;

    const container = splitContainerRef.current;
    const rect = container.getBoundingClientRect();

    // Calculate position based on split orientation
    const newPosition = articleView === 'split-horizontal'
      ? ((e.clientY - rect.top) / rect.height) * 100
      : ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(newPosition);
  }, [isDragging, setSplitPosition, articleView]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = articleView === 'split-horizontal' ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, articleView]);

  // Detect portrait orientation
  useEffect(() => {
    const checkOrientation = () => {
      // Check if viewport is portrait (height > width) and it's a mobile-sized screen
      const isPortraitMode = window.innerHeight > window.innerWidth && window.innerWidth < 800;
      setIsPortrait(isPortraitMode);
    };

    // Check on mount
    checkOrientation();

    // Listen for resize/orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Portrait mode overlay component
  const PortraitOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8"
    >
      <motion.div
        animate={{ rotate: [0, -90, -90, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeInOut",
        }}
        className="mb-8"
      >
        <div className="relative">
          <Smartphone className="w-24 h-24 text-white" strokeWidth={1.5} />
          <motion.div
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2.5,
                ease: "easeInOut",
              }}
              className="w-3 h-3 rounded-full bg-accent-500"
            />
          </motion.div>
        </div>
      </motion.div>
      <h2 className="text-2xl font-bold text-white text-center mb-3">
        {tSettings('rotateDevice.title')}
      </h2>
      <p className="text-gray-400 text-center max-w-xs">
        {tSettings('rotateDevice.description')}
      </p>
    </motion.div>
  );

  // Show portrait mode overlay
  if (isPortrait) {
    return (
      <AnimatePresence>
        <PortraitOverlay />
      </AnimatePresence>
    );
  }

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
            <h2 className="text-2xl font-bold mb-2">{t('welcome.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('welcome.description')}
            </p>
            <Button onClick={() => setIsAddFeedOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('welcome.addFirstFeed')}
            </Button>
          </motion.div>
        </div>

        <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
        <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
  }

  // Vertical split view layout (side by side)
  if (articleView === 'split-vertical') {
    return (
      <>
        <div ref={splitContainerRef} className="h-full flex">
          {/* Article list */}
          <div
            className="flex flex-col min-w-0 pr-2"
            style={{ width: `${splitPosition}%` }}
          >
            <ArticleListHeader
              title={viewTitles[selectedView]}
              showControls={selectedView !== 'search'}
              sortOrder={sortOrder}
              onToggleSort={toggleSortOrder}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkPast1DayAsRead={handleMarkPast1DayAsRead}
              onMarkPast7DaysAsRead={handleMarkPast7DaysAsRead}
            />
            <div className="flex-1 overflow-y-auto">
              {selectedView === 'search' ? (
                <SearchResults onSelectArticle={handleSelectArticle} />
              ) : (
                <ArticleList onSelectArticle={handleSelectArticle} sortOrder={sortOrder} />
              )}
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="relative flex-shrink-0 w-4 group cursor-col-resize"
            onMouseDown={handleMouseDown}
          >
            {/* Visible handle line */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-accent-500 group-active:bg-accent-500 transition-colors" />
            {/* Wider hit area */}
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>

          {/* Article view */}
          <div
            className="glass rounded-xl overflow-hidden pl-2"
            style={{ width: `${100 - splitPosition}%` }}
          >
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

  // Horizontal split view layout (top/bottom)
  if (articleView === 'split-horizontal') {
    return (
      <>
        <div ref={splitContainerRef} className="h-full flex flex-col">
          {/* Article list */}
          <div
            className="flex flex-col min-w-0 pb-2"
            style={{ height: `${splitPosition}%` }}
          >
            <ArticleListHeader
              title={viewTitles[selectedView]}
              showControls={selectedView !== 'search'}
              sortOrder={sortOrder}
              onToggleSort={toggleSortOrder}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkPast1DayAsRead={handleMarkPast1DayAsRead}
              onMarkPast7DaysAsRead={handleMarkPast7DaysAsRead}
            />
            <div className="flex-1 overflow-y-auto">
              {selectedView === 'search' ? (
                <SearchResults onSelectArticle={handleSelectArticle} />
              ) : (
                <ArticleList onSelectArticle={handleSelectArticle} sortOrder={sortOrder} />
              )}
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="relative flex-shrink-0 h-4 group cursor-row-resize"
            onMouseDown={handleMouseDown}
          >
            {/* Visible handle line */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-accent-500 group-active:bg-accent-500 transition-colors" />
            {/* Wider hit area */}
            <div className="absolute inset-x-0 -top-1 -bottom-1" />
          </div>

          {/* Article view */}
          <div
            className="glass rounded-xl overflow-hidden pt-2"
            style={{ height: `${100 - splitPosition}%` }}
          >
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

  // Full view - show article only when selected
  if (articleView === 'full' && selectedArticleId) {
    return (
      <>
        <div className="h-full flex flex-col">
          <ArticleView
            articleId={selectedArticleId}
            onClose={handleCloseArticle}
            mode="full"
          />
        </div>

        <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
        <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
  }

  // List/Overlay view layout
  return (
    <>
      <div className="h-full flex flex-col">
        <ArticleListHeader
          title={viewTitles[selectedView]}
          showControls={selectedView !== 'search'}
          sortOrder={sortOrder}
          onToggleSort={toggleSortOrder}
          onMarkAllAsRead={handleMarkAllAsRead}
          onMarkPast1DayAsRead={handleMarkPast1DayAsRead}
          onMarkPast7DaysAsRead={handleMarkPast7DaysAsRead}
          className="mb-6"
        />
        <div className="flex-1 overflow-y-auto">
          {selectedView === 'search' ? (
            <SearchResults onSelectArticle={handleSelectArticle} />
          ) : (
            <ArticleList onSelectArticle={handleSelectArticle} sortOrder={sortOrder} />
          )}
        </div>
      </div>

      {/* Overlay article view */}
      <AnimatePresence>
        {selectedArticleId && articleView === 'overlay' && (
          <ArticleView
            key="overlay-article-view"
            articleId={selectedArticleId}
            onClose={handleCloseArticle}
            mode="overlay"
          />
        )}
      </AnimatePresence>

      <AddFeedModal isOpen={isAddFeedOpen} onClose={() => setIsAddFeedOpen(false)} />
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
