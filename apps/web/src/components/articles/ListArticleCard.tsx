import { Rss } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useTimeFormat } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ArticleWithState } from '@arss/types';

interface ListArticleCardProps {
  article: ArticleWithState;
  isSelected: boolean;
  onClick: () => void;
}

export function ListArticleCard({ article, isSelected, onClick }: ListArticleCardProps) {
  const { formatRelativeTime } = useTimeFormat();

  return (
    <Card
      hover
      className={cn(
        'cursor-pointer transition-all duration-200',
        article.isRead && 'opacity-60',
        isSelected && 'ring-2 ring-accent-500'
      )}
      onClick={onClick}
    >
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
              <img src={article.feed.iconUrl} alt="" className="w-4 h-4 rounded" />
            ) : (
              <Rss className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500 truncate">{article.feed.title}</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatRelativeTime(article.publishedAt)}
            </span>
          </div>
          <h3 className="font-semibold line-clamp-2 mb-1">{article.title}</h3>
          {article.summary && (
            <p className="text-sm text-gray-500 line-clamp-2">{article.summary}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
