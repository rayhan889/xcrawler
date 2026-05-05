import { createObjectCsvWriter } from 'csv-writer';
import { Tweet } from '../types.js';
import { logger } from '../utils/logger.js';
import * as fs from 'fs';

/**
 * The CsvOutput class handles writing scraped tweets to a CSV file.
 *
 * KEY DESIGN DECISIONS:
 *
 * 1. INCREMENTAL WRITES: We write tweets to disk in batches as they're
 *    collected, rather than buffering everything in memory. If the crawler
 *    crashes mid-run (or the user hits Ctrl+C), all previously written
 *    tweets are safely on disk.
 *
 * 2. APPEND MODE: The CSV writer checks if the file already exists.
 *    If it does, it skips writing the header row and just appends data.
 *    This means you can run the crawler multiple times with the same
 *    output file and all results accumulate.
 *
 * 3. PROPER ESCAPING: The csv-writer library handles edge cases like
 *    tweets containing commas, quotes, or newlines. Without this,
 *    a tweet like: He said, "hello" would break your CSV.
 */
export class CsvOutput {
  private outputPath: string;
  private totalWritten: number = 0;

  // CSV column definitions — maps our Tweet fields to column headers
  private static readonly HEADERS = [
    { id: 'conversationId', title: 'Conversation ID' },
    { id: 'fullText', title: 'Full Text' },
    { id: 'authorHandle', title: 'Author Handle' },
    { id: 'authorName', title: 'Author Name' },
    { id: 'likeCount', title: 'Likes' },
    { id: 'replyCount', title: 'Replies' },
    { id: 'retweetCount', title: 'Retweets' },
    { id: 'tweetUrl', title: 'Tweet URL' },
    { id: 'scrapedAt', title: 'Scraped At' },
  ];

  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  public async writeBatch(tweets: Tweet[]): Promise<void> {
    if (tweets.length === 0) return;

    const fileExists = fs.existsSync(this.outputPath);

    const writer = createObjectCsvWriter({
      path: this.outputPath,
      header: CsvOutput.HEADERS,
      append: fileExists,
    });

    await writer.writeRecords(tweets);
    this.totalWritten += tweets.length;
    logger.info(`Wrote ${tweets.length} tweets to ${this.outputPath} (total: ${this.totalWritten})`);
  }

  public get writtenCount(): number {
    return this.totalWritten;
  }
}
