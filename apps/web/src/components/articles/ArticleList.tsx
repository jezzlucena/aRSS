import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Rss, BookOpen } from 'lucide-react';
import { Card, CardContent, Spinner, ArticleListSkeleton } from '@/components/ui';
import { useArticles, useMarkAsRead } from '@/hooks/useArticles';
import { useUIStore } from '@/stores/uiStore';
import { useArticleStore } from '@/stores/articleStore';
import { useFeedStore } from '@/stores/feedStore';
import { formatRelativeTime } from '@arss/utils';
import { cn } from '@/lib/utils';
import type { ArticleWithState } from '@arss/types';

interface ArticleListProps {
  onSelectArticle?: (article: ArticleWithState) => void;
}

export function ArticleList({ onSelectArticle }: ArticleListProps) {
  const { layout } = useUIStore();
  const { selectedArticleId } = useArticleStore();
  const { selectedFeedId, selectedCategoryId, selectedView } = useFeedStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filters = {
    feedId: selectedFeedId ?? undefined,
    categoryId: selectedCategoryId ?? undefined,
    isRead: selectedView === 'unread' ? false : undefined,
    isSaved: selectedView === 'saved' ? true : undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useArticles(filters);

  const markAsRead = useMarkAsRead();

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

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <ArticleListSkeleton layout={layout} count={6} />;
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">No articles</h3>
        <p className="text-gray-500">
          {selectedView === 'saved'
            ? 'No saved articles yet.'
            : selectedView === 'unread'
            ? 'All caught up!'
            : 'No articles to display.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          layout === 'cards' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
          layout === 'magazine' && 'grid grid-cols-1 lg:grid-cols-2 gap-6',
          layout === 'list' && 'space-y-2'
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
  layout: 'list' | 'cards' | 'magazine';
  isSelected: boolean;
  onClick: () => void;
}

function ArticleCard({ article, layout, isSelected, onClick }: ArticleCardProps) {
  const baseClasses = cn(
    'cursor-pointer transition-all duration-200',
    article.isRead && 'opacity-60',
    isSelected && 'ring-2 ring-accent-500'
  );

  if (layout === 'list') {
    return (
      <Card hover className={baseClasses} onClick={onClick}>
        <CardContent className="p-4 flex items-start gap-4">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt=""
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {article.feed.iconUrl ? (
                <img
                  src={article.feed.iconUrl}
                  alt=""
                  className="w-4 h-4 rounded"
                />
              ) : (
                <Rss className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs text-gray-500 truncate">
                {article.feed.title}
              </span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>
            <h3 className="font-semibold line-clamp-2 mb-1">{article.title}</h3>
            {article.summary && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {article.summary}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (layout === 'cards') {
    return (
      <Card hover className={baseClasses} onClick={onClick}>
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-40 object-cover rounded-t-xl"
            loading="lazy"
          />
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {article.feed.iconUrl ? (
              <img
                src={article.feed.iconUrl}
                alt=""
                className="w-4 h-4 rounded"
              />
            ) : (
              <Rss className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500">{article.feed.title}</span>
          </div>
          <h3 className="font-semibold line-clamp-2 mb-2">{article.title}</h3>
          {article.summary && (
            <p className="text-sm text-gray-500 line-clamp-3">
              {article.summary}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {formatRelativeTime(article.publishedAt)}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Magazine layout
  return (
    <Card hover className={baseClasses} onClick={onClick}>
      <CardContent className="p-0 flex">
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            className="w-48 h-full object-cover rounded-l-xl"
            loading="lazy"
          />
        )}
        <div className="flex-1 p-6">
          <div className="flex items-center gap-2 mb-2">
            {article.feed.iconUrl ? (
              <img
                src={article.feed.iconUrl}
                alt=""
                className="w-4 h-4 rounded"
              />
            ) : (
              <Rss className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500">{article.feed.title}</span>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(article.publishedAt)}
            </span>
          </div>
          <h3 className="text-xl font-semibold line-clamp-2 mb-3">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-gray-500 line-clamp-3">{article.summary}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
