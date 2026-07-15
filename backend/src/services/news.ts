import Parser from 'rss-parser';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { stableId } from '../utils/hash.js';
import { saveNews } from '../db/index.js';
import { projectNewsFeeds } from '../data/civic-projects.seed.js';
import type { NewsItem } from '../types/index.js';

const parser = new Parser({
  timeout: 12_000,
  // A browser-like UA so aggregators (e.g. Google News RSS) serve the feed.
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  },
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

/**
 * Simulated Nepali civic headlines used when live feeds are unreachable, so the
 * civic agent stays demonstrably live offline. Deliberately spans disputing and
 * corroborating tone across tracked projects.
 */
const SIMULATED_CIVIC: Omit<NewsItem, 'id' | 'ingestedAt'>[] = [
  {
    title: 'Melamchi water supply disrupted again as monsoon damage delays repairs',
    summary:
      'Residents in Kathmandu report dry taps for weeks as the Melamchi Water Supply Project faces yet another delay, reigniting public frustration over the decades-long project.',
    source: 'sim.janamat',
    link: 'https://example.com/melamchi-delay',
    publishedAt: Date.now() - 60_000,
  },
  {
    title: 'Pokhara International Airport still idle as international flights remain scarce',
    summary:
      'Critics question the debt-funded Pokhara airport as it struggles to attract regular international traffic, raising concerns about its economic viability.',
    source: 'sim.janamat',
    link: 'https://example.com/pokhara-idle',
    publishedAt: Date.now() - 120_000,
  },
  {
    title: 'Kathmandu-Terai Fast Track construction shows progress on key tunnel section',
    summary:
      'Officials say a major tunnel milestone on the Kathmandu-Terai expressway has been completed, though analysts note the overall timeline has slipped repeatedly.',
    source: 'sim.janamat',
    link: 'https://example.com/fasttrack-progress',
    publishedAt: Date.now() - 180_000,
  },
];

export class NewsService {
  private simulated = false;

  /** Pull all configured crypto feeds (legacy SolVane path). */
  async fetchLatest(): Promise<NewsItem[]> {
    return this.fetchFrom(config.newsFeeds, SIMULATED);
  }

  /**
   * Pull civic discourse, dedup, persist. Combines the configured Nepali news
   * feeds (broad national discourse) with a live news-search feed derived from
   * each tracked project (real, project-specific coverage that actually
   * attributes). Returns only genuinely new items.
   */
  async fetchCivic(): Promise<NewsItem[]> {
    const feeds = Array.from(new Set([...config.civic.feeds, ...projectNewsFeeds()]));
    return this.fetchFrom(feeds, SIMULATED_CIVIC);
  }

  /** Core: parse the given feeds, dedup+persist, fall back to `fallback` items. */
  private async fetchFrom(
    feeds: string[],
    fallback: Omit<NewsItem, 'id' | 'ingestedAt'>[],
  ): Promise<NewsItem[]> {
    const now = Date.now();
    const collected: NewsItem[] = [];

    const results = await Promise.allSettled(feeds.map((url) => parser.parseURL(url)));

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
      for (const s of fallback) {
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
