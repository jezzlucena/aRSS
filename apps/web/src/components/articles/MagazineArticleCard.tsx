import { Rss } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useTimeFormat } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ArticleWithState } from '@arss/types';

interface MagazineArticleCardProps {
  article: ArticleWithState;
  isSelected: boolean;
  onClick: () => void;
}

export function MagazineArticleCard({ article, isSelected, onClick }: MagazineArticleCardProps) {
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
      <CardContent className="p-0 flex flex-col">
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-36 object-cover rounded-l-xl"
            loading="lazy"
          />
        )}
        <div className="flex-1 p-6">
          <div className="flex items-center gap-2 mb-2">
            {article.feed.iconUrl ? (
              <img src={article.feed.iconUrl} alt="" className="w-4 h-4 rounded" />
            ) : (
              <Rss className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500">{article.feed.title}</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatRelativeTime(article.publishedAt)}
            </span>
          </div>
          <h3 className="text-xl font-semibold line-clamp-2 mb-3">{article.title}</h3>
          {article.summary && <p className="text-gray-500 line-clamp-3">{article.summary}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
