import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { fetchFeedArticles } from '../services/feedService.js';
import { db, feeds, subscriptions } from '../db/index.js';
import { eq, lt, or, isNull } from 'drizzle-orm';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Queue for feed refresh jobs
export const feedQueue = new Queue('feed-refresh', { connection });

// Worker to process feed refresh jobs
export const feedWorker = new Worker(
  'feed-refresh',
  async (job: Job<{ feedId: string; feedUrl: string }>) => {
    const { feedId, feedUrl } = job.data;
    console.log(`[Feed Worker] Refreshing feed: ${feedId}`);

    try {
      const count = await fetchFeedArticles(feedId, feedUrl);
      console.log(`[Feed Worker] Fetched ${count} new articles for feed ${feedId}`);
      return { success: true, newArticles: count };
    } catch (error) {
      console.error(`[Feed Worker] Error refreshing feed ${feedId}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

feedWorker.on('completed', (job, result) => {
  console.log(`[Feed Worker] Job ${job.id} completed:`, result);
});

feedWorker.on('failed', (job, error) => {
  console.error(`[Feed Worker] Job ${job?.id} failed:`, error.message);
});

// Schedule refresh for a single feed
export async function scheduleFeedRefresh(feedId: string, feedUrl: string) {
  await feedQueue.add(
    'refresh',
    { feedId, feedUrl },
    {
      jobId: `feed-${feedId}`,
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );
}

// Schedule refresh for all feeds that need updating
export async function scheduleAllFeedsRefresh() {
  // Get all feeds that haven't been fetched in the last 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const feedsToRefresh = await db.query.feeds.findMany({
    where: or(
      isNull(feeds.lastFetchedAt),
      lt(feeds.lastFetchedAt, thirtyMinutesAgo)
    ),
  });

  console.log(`[Feed Worker] Scheduling refresh for ${feedsToRefresh.length} feeds`);

  for (const feed of feedsToRefresh) {
    await scheduleFeedRefresh(feed.id, feed.url);
  }
}

// Start periodic refresh (every 15 minutes)
export function startPeriodicRefresh() {
  // Initial refresh
  scheduleAllFeedsRefresh();

  // Schedule periodic refresh
  setInterval(() => {
    scheduleAllFeedsRefresh();
  }, 15 * 60 * 1000);
}
