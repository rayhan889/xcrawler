import { z } from 'zod';

export const ConfigSchema = z.object({
  keywords: z.string().min(1, 'Keywords cannot be empty'),
  lang: z.string().default('en'),
  output: z.string().default('./output.csv'),
  max: z.coerce.number().positive().default(100),
  authToken: z.string().min(1, 'Auth token is required for scraping'),
  batchSize: z.coerce.number().positive().default(100),
  batchDelay: z.coerce.number().positive().default(60),
  headless: z.boolean().default(true),
  db: z.string().default('./xcrawler.db'),
});
