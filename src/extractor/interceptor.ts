import { Page } from 'playwright';
import { Tweet } from '../types.js';
import { parseTweetsFromResponse } from './parser.js';
import { logger } from '../utils/logger.js';

export class TweetInterceptor {
  private capturedTweets: Tweet[] = [];
  private isAttached: boolean = false;

  public attach(page: Page): void {
    if (this.isAttached) return;

    page.on('response', async (response) => {
      try {
        const url = response.url();

        if (
          url.includes('/i/api/graphql/') &&
          url.includes('SearchTimeline')
        ) {
          const contentType = response.headers()['content-type'] || '';
          if (response.status() !== 200 || !contentType.includes('application/json')) {
            return;
          }

          const body = await response.json();
          const tweets = parseTweetsFromResponse(body);

          if (tweets.length > 0) {
            this.capturedTweets.push(...tweets);
            logger.debug(`Intercepted ${tweets.length} tweets from GraphQL response`);
          }
        }
      } catch (error) {
        logger.debug(`Response intercept error (non-critical): ${error}`);
      }
    });

    this.isAttached = true;
    logger.debug('Tweet interceptor attached to page');
  }

  public drain(): Tweet[] {
    const tweets = [...this.capturedTweets];
    this.capturedTweets = [];
    return tweets;
  }

  public get pendingCount(): number {
    return this.capturedTweets.length;
  }
}
