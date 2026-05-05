import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  clean: true,
  dts: true,
  splitting: true,
  sourcemap: true,
  shims: true,
  external: ['playwright', 'playwright-extra', 'puppeteer-extra-plugin-stealth', 'better-sqlite3'],
});
