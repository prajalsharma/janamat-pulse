import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { PriceSnapshot } from '../types/index.js';

/**
 * Price oracle with two modes:
 *   live      : real spot price (Jupiter, then Pyth, then a simulated walk).
 *   sentiment : a news-reactive simulated price. Anchored once to the real spot
 *               price, then each tick it drifts by the latest news sentiment
 *               (good news nudges up, bad news down) plus small bounded noise,
 *               so the chart visibly reflects the fetched headlines over time.
 *               This is the demo + backup path and needs no AI (the heuristic
 *               score drives it just fine).
 *
 * Live execution ALWAYS uses real price: config forces mode to 'live' whenever
 * EXECUTION_MODE is live, so real trades never size off a simulated number.
 */

const PYTH_SOL_FEED = 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

const KNOWN_SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: 'SOL',
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
};

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export class PriceService {
  private simPrice = 0; // 0 = not yet anchored
  private noiseSeq = 0;

  async fromJupiter(mint: string): Promise<number | null> {
    try {
      const base = process.env.JUP_API_BASE || 'https://lite-api.jup.ag';
      const data = await fetchJson(`${base}/price/v3?ids=${mint}`);
      // v3 schema: { [mint]: { usdPrice, ... } }
      const p = data?.[mint]?.usdPrice;
      return p ? Number(p) : null;
    } catch (err) {
      logger.debug({ err: (err as Error).message }, 'jupiter price failed');
      return null;
    }
  }

  async fromPyth(): Promise<number | null> {
    try {
      const data = await fetchJson(
        `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED}`,
      );
      const feed = data?.parsed?.[0]?.price;
      if (!feed) return null;
      return Number(feed.price) * 10 ** Number(feed.expo);
    } catch (err) {
      logger.debug({ err: (err as Error).message }, 'pyth price failed');
      return null;
    }
  }

  /** Real spot price with graceful degradation. Keeps simPrice anchored. */
  private async livePrice(mint: string): Promise<{ price: number; source: string }> {
    let price = await this.fromJupiter(mint);
    let source = 'jupiter';
    if (price == null && mint === config.trade.baseMint) {
      price = await this.fromPyth();
      source = 'pyth';
    }
    if (price == null) {
      this.noiseSeq += 1;
      const drift = Math.sin(this.noiseSeq / 5) * 1.5 + Math.cos(this.noiseSeq / 11) * 0.8;
      this.simPrice = Math.max(1, (this.simPrice || 150) + drift);
      return { price: Number(this.simPrice.toFixed(2)), source: 'simulated' };
    }
    this.simPrice = price; // keep the anchor fresh for sentiment mode
    return { price, source };
  }

  /** Anchor the simulated price to a believable spot value once. */
  private async ensureAnchored(mint: string): Promise<void> {
    if (this.simPrice > 0) return;
    const real = await this.fromJupiter(mint);
    this.simPrice = real ?? 150;
  }

  /**
   * Advance the news-reactive price by one step. Direction and size come from
   * the sentiment score in [-1, 1]; small bounded noise keeps it off a straight
   * line. Positive score trends up, negative trends down, over successive ticks.
   */
  private driftBySentiment(score: number): { price: number; source: string } {
    this.noiseSeq += 1;
    const s = Math.max(-1, Math.min(1, Number.isFinite(score) ? score : 0));
    const directionalPct = s * config.price.maxDriftPct; // the news signal
    const noisePct = Math.sin(this.noiseSeq / 3) * 0.12; // ~ +/- 0.12%
    this.simPrice = Math.max(1, this.simPrice * (1 + (directionalPct + noisePct) / 100));
    return { price: Number(this.simPrice.toFixed(2)), source: 'sentiment' };
  }

  /**
   * Get a price snapshot. Pass the latest sentiment score during an agent tick
   * to advance the news-driven price; omit it (e.g. for a P&L mark read) to get
   * the current value without advancing it.
   */
  async getPrice(mint = config.trade.baseMint, sentimentScore?: number): Promise<PriceSnapshot> {
    const symbol = KNOWN_SYMBOLS[mint] ?? mint.slice(0, 4);
    const sentimentMode = config.price.mode === 'sentiment' && mint === config.trade.baseMint;

    let price: number;
    let source: string;

    if (sentimentMode) {
      await this.ensureAnchored(mint);
      if (sentimentScore != null) {
        ({ price, source } = this.driftBySentiment(sentimentScore));
      } else {
        // Read-only (portfolio mark): return the current level, do not advance.
        price = Number(this.simPrice.toFixed(2));
        source = 'sentiment';
      }
    } else {
      ({ price, source } = await this.livePrice(mint));
    }

    logger.debug({ mint, symbol, price, source }, 'price snapshot');
    return { mint, symbol, priceUsd: price, at: Date.now(), source };
  }
}

export const priceService = new PriceService();
