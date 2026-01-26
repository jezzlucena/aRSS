import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rss, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui';
import { useUpdateSubscription } from '@/hooks/useFeeds';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { SubscriptionWithFeed } from '@arss/types';

interface EditFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionWithFeed | null;
}

export function EditFeedModal({ isOpen, onClose, subscription }: EditFeedModalProps) {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const updateSubscription = useUpdateSubscription();

  useEffect(() => {
    if (subscription) {
      setCustomTitle(subscription.customTitle || '');
      setSelectedCategoryId(subscription.categoryId);
    }
  }, [subscription]);

  const handleSave = async () => {
    if (!subscription) return;

    await updateSubscription.mutateAsync({
      feedId: subscription.feedId,
      customTitle: customTitle.trim() || null,
      categoryId: selectedCategoryId,
    });

    onClose();
  };

  const handleClose = () => {
    setCustomTitle('');
    setSelectedCategoryId(null);
    updateSubscription.reset();
    onClose();
  };

  if (!subscription) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Edit Feed</CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Feed Info */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                    {subscription.feed.iconUrl ? (
                      <img
                        src={subscription.feed.iconUrl}
                        alt=""
                        className="w-6 h-6 rounded"
                      />
                    ) : (
                      <Rss className="w-5 h-5 text-accent-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{subscription.feed.title}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {subscription.feed.url}
                    </p>
                  </div>
                </div>

                {/* Custom Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Title</label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={subscription.feed.title}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to use the original feed title
                  </p>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all',
                        selectedCategoryId === null
                          ? 'bg-accent-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      Uncategorized
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5',
                          selectedCategoryId === cat.id
                            ? 'bg-accent-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateSubscription.isPending}>
                  {updateSubscription.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
