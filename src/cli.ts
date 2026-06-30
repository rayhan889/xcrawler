#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigSchema } from './config.js';
import { XCrawler } from './engine/crawler.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('xcrawler')
  .description(
    'Stealth X/Twitter web crawler for research purposes.\n' +
      'Scrapes tweets matching keywords with human-like behavior.'
  )
  .version('0.1.0');

program
  .command('search')
  .description('Search and scrape tweets matching the given keywords')
  .requiredOption(
    '-k, --keywords <query>',
    'Search keywords (supports X search operators like OR, from:, etc.)'
  )
  .requiredOption(
    '--auth-token <token>',
    'Your X/Twitter auth_token cookie value (required)'
  )
  .option(
    '-l, --lang <code>',
    'Language filter (ISO 639-1 code, omit for all languages)'
  )
  .option('-o, --output <path>', 'Output CSV file path', './output.csv')
  .option('-m, --max <number>', 'Maximum number of tweets to collect', '100')
  .option(
    '--batch-size <number>',
    'Number of tweets per batch before cooldown',
    '100'
  )
  .option(
    '--batch-delay <seconds>',
    'Cooldown delay between batches in seconds',
    '60'
  )
  .option('--no-headless', 'Run browser in visible mode (useful for debugging)')
  .option(
    '--db <path>',
    'Path to the deduplication database file',
    './xcrawler.db'
  )
  .action(async (options) => {
    try {
      // Map CLI options to our config shape.
      // Commander uses camelCase for multi-word flags (--auth-token → authToken),
      // and --no-headless inverts the boolean (headless becomes false).
      const rawConfig = {
        keywords: options.keywords,
        lang: options.lang,
        output: options.output,
        max: options.max,
        authToken: options.authToken,
        batchSize: options.batchSize,
        batchDelay: options.batchDelay,
        headless: options.headless,
        db: options.db,
      };

      // Validate with Zod — this catches bad input before we launch a browser
      const config = ConfigSchema.parse(rawConfig);

      console.log('\n🔍 XCrawler v0.1.0');
      console.log('━'.repeat(40));
      console.log(`  Keywords   : ${config.keywords}`);
      console.log(`  Language   : ${config.lang ?? 'any'}`);
      console.log(`  Max tweets : ${config.max}`);
      console.log(`  Output     : ${config.output}`);
      console.log(`  Headless   : ${config.headless}`);
      console.log(`  Batch size : ${config.batchSize}`);
      console.log('━'.repeat(40) + '\n');

      const crawler = new XCrawler(config);
      await crawler.crawl();
    } catch (error: any) {
      // Zod validation errors have a nice .issues array
      if (error.issues) {
        logger.error('Invalid configuration:');
        for (const issue of error.issues) {
          console.error(`  ✗ ${issue.path.join('.')}: ${issue.message}`);
        }
      } else {
        logger.error('Crawl failed:', error.message || error);
      }
      process.exit(1);
    }
  });

// If no command is provided, show help
program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
