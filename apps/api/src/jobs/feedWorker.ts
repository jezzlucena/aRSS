import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { fetchFeedArticles } from '../services/feedService.js';
import { db, feeds, subscriptions } from '../db/index.js';
import { eq, lt, or, isNull } from 'drizzle-orm';
import { createLogger } from '../lib/logger.js';

const logger = createLogger('FeedWorker');

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
    logger.info('Refreshing feed', { feedId });

    try {
      const count = await fetchFeedArticles(feedId, feedUrl);
      logger.info('Fetched new articles', { feedId, count });
      return { success: true, newArticles: count };
    } catch (error) {
      logger.error('Error refreshing feed', error, { feedId });
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
  logger.debug('Job completed', { jobId: job.id, result });
});

feedWorker.on('failed', (job, error) => {
  logger.error('Job failed', error, { jobId: job?.id });
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

  logger.info('Scheduling feed refresh', { count: feedsToRefresh.length });

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
