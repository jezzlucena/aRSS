import { Rss } from 'lucide-react';
import { useTimeFormat } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ArticleWithState } from '@arss/types';

interface CompactArticleRowProps {
  article: ArticleWithState;
  isSelected: boolean;
  onClick: () => void;
}

export function CompactArticleRow({ article, isSelected, onClick }: CompactArticleRowProps) {
  const { formatRelativeTime } = useTimeFormat();

  return (
    <div
      className={cn(
        'px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
        isSelected && 'bg-accent-500/10',
        article.isRead && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Unread indicator */}
        {!article.isRead && (
          <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />
        )}
        {article.isRead && <span className="w-2 flex-shrink-0" />}

        {/* Feed icon */}
        {article.feed.iconUrl ? (
          <img src={article.feed.iconUrl} alt="" className="w-4 h-4 rounded flex-shrink-0" />
        ) : (
          <Rss className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}

        {/* Title */}
        <h3 className="flex-1 text-sm font-medium truncate">{article.title}</h3>

        {/* Time */}
        <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
          {formatRelativeTime(article.publishedAt)}
        </span>
      </div>
    </div>
  );
}
