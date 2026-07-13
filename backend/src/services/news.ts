import Parser from 'rss-parser';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { stableId } from '../utils/hash.js';
import { saveNews } from '../db/index.js';
import type { NewsItem } from '../types/index.js';

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'SolVane/1.0 (+news-sentiment-agent)' },
});

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function clean(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

/**
 * Simulated headlines used when live RSS feeds are unreachable (offline dev,
 * rate limits). Keeps the agent demonstrably "live" without external deps.
 */
const SIMULATED: Omit<NewsItem, 'id' | 'ingestedAt'>[] = [
  {
    title: 'Solana sees record NFT mint volume as major collection launches',
    summary:
      'A blue-chip NFT collection minted out in minutes on Solana, driving network activity and SOL demand to a monthly high.',
    source: 'sim.solvane',
    link: 'https://example.com/sol-nft-record',
    publishedAt: Date.now() - 60_000,
  },
  {
    title: 'Jupiter DEX reports all-time-high daily swap volume on Solana',
    summary:
      'Aggregated DEX volume routed through Jupiter surpassed prior records, signalling strong on-chain liquidity and trader confidence.',
    source: 'sim.solvane',
    link: 'https://example.com/jup-ath',
    publishedAt: Date.now() - 120_000,
  },
  {
    title: 'Analysts flag short-term caution as SOL funding rates spike',
    summary:
      'Elevated perp funding suggests crowded long positioning; some desks warn of a possible near-term pullback.',
    source: 'sim.solvane',
    link: 'https://example.com/sol-funding',
    publishedAt: Date.now() - 180_000,
  },
];

export class NewsService {
  private simulated = false;

  /** Pull all configured feeds, dedup, persist. Returns only genuinely new items. */
  async fetchLatest(): Promise<NewsItem[]> {
    const now = Date.now();
    const collected: NewsItem[] = [];

    const results = await Promise.allSettled(
      config.newsFeeds.map((url) => parser.parseURL(url)),
    );

    for (const r of results) {
      if (r.status !== 'fulfilled') {
        logger.warn({ err: (r.reason as Error)?.message }, 'news feed failed');
        continue;
      }
      const feed = r.value;
      for (const entry of feed.items ?? []) {
        const link = entry.link ?? entry.guid ?? '';
        const title = entry.title?.trim();
        if (!title) continue;
        collected.push({
          id: stableId(link || title),
          title,
          summary: clean(entry.contentSnippet ?? entry.content ?? entry.summary),
          source: hostOf(feed.link ?? link),
          link,
          publishedAt: entry.isoDate ? Date.parse(entry.isoDate) : now,
          ingestedAt: now,
        });
      }
    }

    // Fall back to simulated headlines if every feed failed.
    if (collected.length === 0) {
      if (!this.simulated) {
        logger.warn('all live feeds unreachable - using simulated headlines');
        this.simulated = true;
      }
      for (const s of SIMULATED) {
        collected.push({ ...s, id: stableId(s.link, now), ingestedAt: now });
      }
    } else {
      this.simulated = false;
    }

    const fresh = saveNews(collected);
    if (fresh.length) logger.info({ count: fresh.length }, 'ingested fresh headlines');
    return fresh;
  }

  get usingSimulated(): boolean {
    return this.simulated;
  }
}

export const newsService = new NewsService();
