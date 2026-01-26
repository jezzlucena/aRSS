import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rss, Plus, Search } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { FeedCard } from './FeedCard';
import { EditFeedModal } from './EditFeedModal';
import { AddFeedModal } from './AddFeedModal';
import { useFeeds } from '@/hooks/useFeeds';
import { useFeedStore } from '@/stores/feedStore';
import type { SubscriptionWithFeed } from '@arss/types';

export function FeedList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<SubscriptionWithFeed | null>(null);

  const { data: feeds = [], isLoading } = useFeeds();
  const { selectedFeedId, selectFeed } = useFeedStore();

  const filteredFeeds = feeds.filter((sub) => {
    const title = sub.customTitle || sub.feed.title;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Feeds</h2>
        <Button size="sm" onClick={() => setIsAddFeedOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Feed
        </Button>
      </div>

      {/* Search */}
      {feeds.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            glass
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feeds..."
            className="pl-10"
          />
        </div>
      )}

      {/* Feed List */}
      {feeds.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-500/10 flex items-center justify-center">
            <Rss className="w-8 h-8 text-accent-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No feeds yet</h3>
          <p className="text-gray-500 mb-4">
            Add your first RSS feed to get started
          </p>
          <Button onClick={() => setIsAddFeedOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Feed
          </Button>
        </motion.div>
      ) : filteredFeeds.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No feeds matching "{searchQuery}"
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFeeds.map((subscription, index) => (
            <motion.div
              key={subscription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FeedCard
                subscription={subscription}
                isSelected={selectedFeedId === subscription.feedId}
                onClick={() => selectFeed(subscription.feedId)}
                onEdit={() => setEditingFeed(subscription)}
                onMove={() => setEditingFeed(subscription)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddFeedModal
        isOpen={isAddFeedOpen}
        onClose={() => setIsAddFeedOpen(false)}
      />
      <EditFeedModal
        isOpen={!!editingFeed}
        onClose={() => setEditingFeed(null)}
        subscription={editingFeed}
      />
    </div>
  );
}
