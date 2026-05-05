import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export class DedupStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS seen_tweets (
        tweet_id TEXT PRIMARY KEY,
        first_seen_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_seen_at ON seen_tweets(first_seen_at);
    `);
    logger.debug('Initialized SQLite dedup schema');
  }

  public isSeen(tweetId: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM seen_tweets WHERE tweet_id = ?');
    const result = stmt.get(tweetId);
    return result !== undefined;
  }

  public markSeen(tweetId: string): void {
    try {
      const stmt = this.db.prepare('INSERT INTO seen_tweets (tweet_id) VALUES (?)');
      stmt.run(tweetId);
    } catch (err: any) {
      if (err.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        throw err;
      }
    }
  }

  public close(): void {
    this.db.close();
  }
}
