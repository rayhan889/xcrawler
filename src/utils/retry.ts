import { logger } from './logger.js';

export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelayMs?: number } = { maxRetries: 3 }
): Promise<T> {
  let attempt = 0;
  const baseDelay = options.baseDelayMs || 1000;

  while (attempt < options.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= options.maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Operation failed, retrying in ${delay}ms... (Attempt ${attempt}/${options.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry exhausted');
}
