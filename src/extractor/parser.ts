import { Tweet } from '../types.js';
import { logger } from '../utils/logger.js';

export function parseTweetsFromResponse(responseBody: any): Tweet[] {
  const tweets: Tweet[] = [];

  try {
    const instructions =
      responseBody?.data?.search_by_raw_query?.search_timeline?.timeline
        ?.instructions;

    if (!instructions || !Array.isArray(instructions)) {
      logger.debug('No instructions found in GraphQL response');
      return tweets;
    }

    for (const instruction of instructions) {
      const entries = instruction.entries || instruction.moduleItems || [];

      for (const entry of entries) {
        const tweet = extractTweetFromEntry(entry);
        if (tweet) {
          tweets.push(tweet);
        }
      }
    }
  } catch (error) {
    logger.debug(`Failed to parse GraphQL response: ${error}`);
  }

  return tweets;
}

function extractTweetFromEntry(entry: any): Tweet | null {
  try {
    const tweetResult =
      entry?.content?.itemContent?.tweet_results?.result ||
      entry?.item?.itemContent?.tweet_results?.result;

    if (!tweetResult) {
      return null;
    }

    const actualTweet = tweetResult.tweet || tweetResult;

    if (!actualTweet.legacy || !actualTweet.core) {
      return null;
    }

    const legacy = actualTweet.legacy;

    const userResult = actualTweet.core?.user_results?.result;
    logger.debug(`user result: ${JSON.stringify(userResult, null, 2)}`);

    if (!userResult) {
      return null;
    }

    const userCore = userResult.core;

    if (!userCore) {
      logger.debug('userResult.core is missing — skipping tweet');
      return null;
    }

    const tweetId = actualTweet.rest_id || legacy.id_str;
    const authorHandle = userCore?.screen_name || '';
    const authorName = userCore?.name || '';

    logger.debug(`Extracted tweet ID ${tweetId} by @${authorHandle}`);

    return {
      conversationId: legacy.conversation_id_str || '',
      fullText: legacy.full_text || '',
      authorHandle,
      authorName,
      likeCount: legacy.favorite_count || 0,
      replyCount: legacy.reply_count || 0,
      retweetCount: legacy.retweet_count || 0,
      tweetUrl: `https://x.com/${authorHandle}/status/${tweetId}`,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.debug(`Failed to extract tweet from entry: ${error}`);
    return null;
  }
}

/**
 * Extracts the bottom cursor from the GraphQL response.
 * X uses cursors for pagination — the "bottom" cursor tells us
 * where to continue loading more results when we scroll down.
 * We don't use this directly (scrolling triggers it automatically),
 * but it's useful for detecting when we've reached the end of results.
 */
export function extractCursor(responseBody: any): string | null {
  try {
    const instructions =
      responseBody?.data?.search_by_raw_query?.search_timeline?.timeline
        ?.instructions;

    if (!instructions) return null;

    for (const instruction of instructions) {
      const entries = instruction.entries || [];
      for (const entry of entries) {
        // Cursor entries have a specific entryId pattern
        if (
          entry.entryId?.startsWith('cursor-bottom') ||
          entry.entryId?.startsWith('sq-cursor-bottom')
        ) {
          return entry.content?.value || null;
        }
      }
    }
  } catch {
    // Silently ignore cursor extraction failures
  }

  return null;
}
