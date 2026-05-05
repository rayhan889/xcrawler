<div align="center">
  <h1>🕷️ XCrawler</h1>
  <p><strong>A Stealth X/Twitter Web Crawler Engine for Research</strong></p>

  <p>
    <a href="https://github.com/rayhanhendra/xcrawler/actions/workflows/ci.yml"><img src="https://github.com/rayhanhendra/xcrawler/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
    <a href="https://www.npmjs.com/package/@rayhanhendra/xcrawler"><img src="https://img.shields.io/npm/v/@rayhanhendra/xcrawler.svg" alt="NPM Version"></a>
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version">
    <img src="https://img.shields.io/badge/license-ISC-blue.svg" alt="License">
  </p>
</div>

---

XCrawler is a robust, stealth-oriented CLI tool built in TypeScript for scraping tweets from X (formerly Twitter). Designed strictly for **research purposes**, it avoids bot detection using human-like behavior emulation, Playwright stealth plugins, and GraphQL interception.

It features automatic tweet deduplication using SQLite and exports clean data directly to CSV.

## ✨ Features

- 🕵️ **Stealth & Anti-Detection:** Uses `playwright-extra` and `puppeteer-extra-plugin-stealth` to bypass basic bot mitigation.
- 🧠 **Human-like Behavior:** Implements randomized scrolling, batching, and cooldowns to mimic real user patterns and prevent account flagging.
- 📡 **GraphQL Interception:** Intercepts raw GraphQL API responses to extract rich, accurate tweet data directly from the network layer.
- 💾 **Smart Deduplication:** Utilizes a local SQLite database to track seen tweets, ensuring your CSV outputs only contain unique records across multiple runs.
- 📊 **CSV Export:** Automatically formats and pipes extracted data into clean CSV files.

## 🚀 Installation

You can install `xcrawler` globally via npm (or pnpm/yarn):

```bash
npm install -g @rayhanhendra/xcrawler
```

Or run it directly using `npx`:

```bash
npx @rayhanhendra/xcrawler [command] [options]
```

## 🛠️ Usage

### Prerequisites: Authentication Token

To scrape X effectively, you need an `auth_token` cookie from a logged-in X account.

1. Log in to [x.com](https://x.com) on your browser.
2. Open Developer Tools (F12) -> Application -> Cookies.
3. Copy the value of the `auth_token` cookie.
4. *Recommendation: Use a burner account for scraping to avoid risking your primary account.*

### CLI Commands

The primary command is `search`, which accepts search queries using X's standard search operators.

```bash
xcrawler search --keywords "artificial intelligence OR AI" --auth-token "your_token_here"
```

### All Options

| Flag | Alias | Description | Default | Required |
|------|-------|-------------|---------|:--------:|
| `--keywords <query>` | `-k` | Search keywords (supports X search operators) | - | ✅ |
| `--auth-token <token>`| | Your X/Twitter `auth_token` cookie value | - | ✅ |
| `--lang <code>` | `-l` | Language filter (ISO 639-1 code) | `en` | ❌ |
| `--output <path>` | `-o` | Output CSV file path | `./output.csv`| ❌ |
| `--max <number>` | `-m` | Maximum number of tweets to collect | `100` | ❌ |
| `--batch-size <num>` | | Number of tweets per batch before cooldown | `100` | ❌ |
| `--batch-delay <sec>`| | Cooldown delay between batches in seconds | `60` | ❌ |
| `--db <path>` | | Path to the deduplication database file | `./xcrawler.db`| ❌ |
| `--no-headless` | | Run browser in visible mode (useful for debugging) | `false` | ❌ |

### Examples

**1. Basic Search with custom output:**
```bash
npx xcrawler search -k "Next.js 14" --auth-token "abc123xyz..." -o "./nextjs-tweets.csv"
```

**2. Large Scale Extraction with custom batching:**
```bash
npx xcrawler search -k "from:elonmusk" --auth-token "abc123xyz..." -m 1000 --batch-size 200 --batch-delay 120
```

**3. Debugging Mode (Visible Browser):**
```bash
npx xcrawler search -k "typescript" --auth-token "abc123xyz..." --no-headless
```

## 🗄️ Database & Deduplication

XCrawler creates a local SQLite database (default: `xcrawler.db` in your current working directory) during execution. This database remembers the IDs of tweets you have already scraped. 

If you run the exact same search command twice, the second run will skip tweets already saved in the database, preventing duplicate rows in your CSV files.

You can specify a custom database location using the `--db` flag if you want to maintain separate memory banks for different projects.

## ⚠️ Disclaimer

This tool is created for **academic and research purposes only**. 
Scraping X/Twitter may violate their Terms of Service. The developers of this tool assume no liability for misuse, account bans, or legal repercussions resulting from the use of this software. Always respect platform limits and use responsibly.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rayhan889/xcrawler/issues).

## 📄 License

This project is licensed under the [ISC License](LICENSE).
