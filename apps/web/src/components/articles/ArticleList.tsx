import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Spinner, ArticleListSkeleton } from '@/components/ui';
import { useArticles, useMarkAsRead, useInfiniteScroll } from '@/hooks';
import { useUIStore } from '@/stores/uiStore';
import { useArticleStore } from '@/stores/articleStore';
import { useFeedStore } from '@/stores/feedStore';
import { cn } from '@/lib/utils';
import { CompactArticleRow } from './CompactArticleRow';
import { ListArticleCard } from './ListArticleCard';
import { GridArticleCard } from './GridArticleCard';
import { MagazineArticleCard } from './MagazineArticleCard';
import type { ArticleWithState } from '@arss/types';

type SortOrder = 'newest' | 'oldest';

interface ArticleListProps {
  onSelectArticle?: (article: ArticleWithState) => void;
  sortOrder?: SortOrder;
}

export function ArticleList({ onSelectArticle, sortOrder = 'newest' }: ArticleListProps) {
  const { t } = useTranslation('articles');
  const { layout } = useUIStore();
  const { selectedArticleId } = useArticleStore();
  const { selectedFeedId, selectedCategoryId, selectedView } = useFeedStore();

  const filters = {
    feedId: selectedFeedId ?? undefined,
    categoryId: selectedCategoryId ?? undefined,
    isRead: selectedView === 'unread' ? false : undefined,
    isSaved: selectedView === 'saved' ? true : undefined,
    sortOrder: (sortOrder === 'newest' ? 'desc' : 'asc') as 'desc' | 'asc',
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useArticles(filters);
  const markAsRead = useMarkAsRead();

  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const articles = data?.pages.flatMap((page) => page.articles) ?? [];

  const handleSelect = useCallback(
    (article: ArticleWithState) => {
      if (!article.isRead) {
        markAsRead.mutate(article.id);
      }
      onSelectArticle?.(article);
    },
    [markAsRead, onSelectArticle]
  );

  if (isLoading) {
    return <ArticleListSkeleton layout={layout} count={6} />;
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('emptyState.title')}</h3>
        <p className="text-gray-500">
          {selectedView === 'saved'
            ? t('emptyState.noSaved')
            : selectedView === 'unread'
            ? t('emptyState.allCaughtUp')
            : t('emptyState.noArticles')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <div
        className={cn(
          layout === 'cards' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
          layout === 'magazine' && 'grid grid-cols-1 lg:grid-cols-2 gap-6',
          layout === 'list' && 'space-y-2',
          layout === 'compact' && 'space-y-0 divide-y divide-gray-200 dark:divide-gray-700'
        )}
      >
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5) }}
          >
            <ArticleCard
              article={article}
              layout={layout}
              isSelected={selectedArticleId === article.id}
              onClick={() => handleSelect(article)}
            />
          </motion.div>
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}

interface ArticleCardProps {
  article: ArticleWithState;
  layout: 'compact' | 'list' | 'cards' | 'magazine';
  isSelected: boolean;
  onClick: () => void;
}

function ArticleCard({ article, layout, isSelected, onClick }: ArticleCardProps) {
  switch (layout) {
    case 'compact':
      return <CompactArticleRow article={article} isSelected={isSelected} onClick={onClick} />;
    case 'list':
      return <ListArticleCard article={article} isSelected={isSelected} onClick={onClick} />;
    case 'cards':
      return <GridArticleCard article={article} isSelected={isSelected} onClick={onClick} />;
    case 'magazine':
      return <MagazineArticleCard article={article} isSelected={isSelected} onClick={onClick} />;
    default:
      return <ListArticleCard article={article} isSelected={isSelected} onClick={onClick} />;
  }
}
