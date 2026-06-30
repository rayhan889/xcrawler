export interface Tweet {
  conversationId: string;
  fullText: string;
  authorHandle: string;
  authorName: string;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  tweetUrl: string;
  scrapedAt: string;
}

export interface CrawlerConfig {
  keywords: string;
  lang?: string;
  output: string;
  max: number;
  authToken: string;
  batchSize: number;
  batchDelay: number;
  headless: boolean;
  db: string;
}

export interface CrawlResult {
  totalCollected: number;
  totalDuplicates: number;
  durationMs: number;
}
