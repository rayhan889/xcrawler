import { Page, BrowserContext, Browser } from 'playwright';
import { CrawlerConfig, CrawlResult, Tweet } from '../types.js';
import { setupBrowser } from '../stealth/setup.js';
import { humanScroll, randomDelay } from '../stealth/humanize.js';
import { TweetInterceptor } from '../extractor/interceptor.js';
import { DedupStore } from '../store/dedup.js';
import { RateLimiter } from '../limiter/rate-limiter.js';
import { CsvOutput } from '../output/writer.js';
import { logger } from '../utils/logger.js';
import { retry } from '../utils/retry.js';

export class XCrawler {
  private config: CrawlerConfig;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private interceptor: TweetInterceptor;
  private dedupStore: DedupStore;
  private rateLimiter: RateLimiter;
  private csvOutput: CsvOutput;
  private shouldStop: boolean = false;
  private totalCollected: number = 0;
  private totalDuplicates: number = 0;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.interceptor = new TweetInterceptor();
    this.dedupStore = new DedupStore(config.db);
    this.rateLimiter = new RateLimiter(config);
    this.csvOutput = new CsvOutput(config.output);
  }

  public async crawl(): Promise<CrawlResult> {
    const startTime = Date.now();

    this.registerShutdownHandlers();

    try {
      logger.info('Launching stealth browser...');
      const { browser, context } = await setupBrowser(this.config);
      this.browser = browser;
      this.context = context;
      this.page = await context.newPage();

      const searchUrl = this.buildSearchUrl();
      logger.info(`Navigating to: ${searchUrl}`);

      await this.page!.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      logger.info('Waiting for tweet feed to load...');
      await this.page!.waitForSelector('[data-testid="cellInnerDiv"]', { timeout: 30000 })
        .catch(() => {
          logger.warn('Tweet feed did not appear — page may have no results or requires login.');
        });

      await randomDelay(1500, 2500);

      this.interceptor.attach(this.page);

      logger.info(`Starting crawl. Target: ${this.config.max} tweets.`);

      let emptyScrollCount = 0;
      const MAX_EMPTY_SCROLLS = 10;

      while (!this.shouldStop && this.totalCollected < this.config.max) {
        await humanScroll(this.page);

        await randomDelay(1500, 3000);

        const rawTweets = this.interceptor.drain();

        if (rawTweets.length === 0) {
          emptyScrollCount++;
          logger.debug(`No new tweets from scroll (${emptyScrollCount}/${MAX_EMPTY_SCROLLS})`);

          if (emptyScrollCount >= MAX_EMPTY_SCROLLS) {
            logger.info('No more tweets found after multiple scrolls. Ending crawl.');
            break;
          }
          continue;
        }

        emptyScrollCount = 0;

        const newTweets = this.filterAndStore(rawTweets);

        if (newTweets.length > 0) {
          await this.csvOutput.writeBatch(newTweets);
        }

        await this.rateLimiter.checkAndWait();
      }
    } catch (error) {
      logger.error('Crawl failed with error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }

    const result: CrawlResult = {
      totalCollected: this.totalCollected,
      totalDuplicates: this.totalDuplicates,
      durationMs: Date.now() - startTime,
    };

    this.printSummary(result);
    return result;
  }

  private buildSearchUrl(): string {
    const query = `${this.config.keywords} lang:${this.config.lang}`;
    const encoded = encodeURIComponent(query);
    return `https://x.com/search?q=${encoded}&src=typed_query&f=live`;
  }

  private filterAndStore(rawTweets: Tweet[]): Tweet[] {
    const newTweets: Tweet[] = [];

    for (const tweet of rawTweets) {
      const tweetId = tweet.tweetUrl.split('/status/')[1] || tweet.conversationId;

      if (this.dedupStore.isSeen(tweetId)) {
        this.totalDuplicates++;
        continue;
      }

      this.dedupStore.markSeen(tweetId);
      newTweets.push(tweet);

      this.rateLimiter.trackTweetCollected();
      this.totalCollected++;

      if (this.totalCollected >= this.config.max) {
        break;
      }
    }

    if (newTweets.length > 0) {
      logger.info(
        `Processed batch: ${newTweets.length} new, ${rawTweets.length - newTweets.length} duplicates skipped`
      );
    }

    return newTweets;
  }

  private registerShutdownHandlers(): void {
    const handler = () => {
      logger.warn('Shutdown signal received. Finishing current batch...');
      this.shouldStop = true;
    };

    process.on('SIGINT', handler);
    process.on('SIGTERM', handler);
  }

  private async cleanup(): Promise<void> {
    logger.debug('Cleaning up resources...');

    try {
      if (this.page) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch {
      // Browser might already be closed
    }

    try {
      this.dedupStore.close();
    } catch {
      // DB might already be closed
    }
  }

  private printSummary(result: CrawlResult): void {
    const durationSec = (result.durationMs / 1000).toFixed(1);
    console.log('\n' + '='.repeat(50));
    console.log('  CRAWL SUMMARY');
    console.log('='.repeat(50));
    console.log(`  Tweets collected : ${result.totalCollected}`);
    console.log(`  Duplicates skipped : ${result.totalDuplicates}`);
    console.log(`  Duration         : ${durationSec}s`);
    console.log(`  Output file      : ${this.config.output}`);
    console.log(`  Dedup database   : ${this.config.db}`);
    console.log('='.repeat(50) + '\n');
  }

  public stop(): void {
    this.shouldStop = true;
  }
}
