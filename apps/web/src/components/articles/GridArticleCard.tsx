import { Rss } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useTimeFormat } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ArticleWithState } from '@arss/types';

interface GridArticleCardProps {
  article: ArticleWithState;
  isSelected: boolean;
  onClick: () => void;
}

export function GridArticleCard({ article, isSelected, onClick }: GridArticleCardProps) {
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
            <img src={article.feed.iconUrl} alt="" className="w-4 h-4 rounded" />
          ) : (
            <Rss className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-xs text-gray-500">{article.feed.title}</span>
        </div>
        <h3 className="font-semibold line-clamp-2 mb-2">{article.title}</h3>
        {article.summary && (
          <p className="text-sm text-gray-500 line-clamp-3">{article.summary}</p>
        )}
        <p className="text-xs text-gray-400 mt-2 whitespace-nowrap">
          {formatRelativeTime(article.publishedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
