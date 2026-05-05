import { Page } from 'playwright';

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = randomInt(minMs, maxMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

export async function humanScroll(page: Page): Promise<void> {
  const scrollSteps = randomInt(3, 7);
  for (let i = 0; i < scrollSteps; i++) {
    const scrollAmount = randomInt(200, 600);
    await page.mouse.wheel(0, scrollAmount);
    // Tiny pause between scroll wheel ticks
    await randomDelay(50, 200);
  }
}
