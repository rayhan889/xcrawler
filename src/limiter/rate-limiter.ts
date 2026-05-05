import { CrawlerConfig } from '../types.js';
import { randomDelay } from '../stealth/humanize.js';
import { logger } from '../utils/logger.js';

export class RateLimiter {
  private config: CrawlerConfig;
  private currentBatchCount: number = 0;

  constructor(config: CrawlerConfig) {
    this.config = config;
  }

  public trackTweetCollected(): void {
    this.currentBatchCount++;
  }

  /**
   * Called before scrolling for more tweets. Determines if we need a cooldown.
   */
  public async checkAndWait(): Promise<void> {
    if (this.currentBatchCount >= this.config.batchSize) {
      logger.info(`Batch size of ${this.config.batchSize} reached. Cooling down for ${this.config.batchDelay} seconds...`);
      
      // Convert to milliseconds and add a little randomness (± 5 seconds)
      const baseDelay = this.config.batchDelay * 1000;
      const minDelay = Math.max(1000, baseDelay - 5000);
      const maxDelay = baseDelay + 5000;
      
      await randomDelay(minDelay, maxDelay);
      
      // Reset batch count after cooldown
      this.currentBatchCount = 0;
      logger.info('Cooldown finished. Resuming scraping...');
    } else {
      // Standard human-like scroll pause between pages (2-5 seconds)
      await randomDelay(2000, 5000);
    }
  }
}
