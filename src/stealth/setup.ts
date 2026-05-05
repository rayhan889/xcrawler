import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { CrawlerConfig } from '../types.js';

// Add the stealth plugin to playwright-extra
chromium.use(stealthPlugin());

export async function setupBrowser(config: CrawlerConfig) {
  const browser = await chromium.launch({
    headless: config.headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: config.lang === 'en' ? 'en-US' : `${config.lang}-${config.lang.toUpperCase()}`,
    timezoneId: 'America/New_York',
  });

  // Inject the user's auth token
  await context.addCookies([
    {
      name: 'auth_token',
      value: config.authToken,
      domain: '.x.com',
      path: '/',
      secure: true,
      sameSite: 'None',
    },
  ]);

  return { browser, context };
}
