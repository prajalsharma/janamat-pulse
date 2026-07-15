import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { newsService } from '../services/news.js';
import { civicSentimentService } from '../services/civic-sentiment.js';
import { CIVIC_PROJECTS } from '../data/civic-projects.seed.js';
import { recentNews } from '../db/index.js';
import { evaluateAll } from './accountability.js';
import { bus } from './bus.js';

/**
 * How many recent stored headlines to re-evaluate each cycle. The signal is a
 * rolling window over accumulated discourse, not just this tick's fresh items,
 * so accountability stays populated between ticks and across restarts.
 */
const CIVIC_WINDOW = 300;
import type { CivicPulseSnapshot, CivicProjectView } from '../types/civic.js';

/**
 * The Janamat Pulse orchestrator. One tick =
 *   ingest civic news → score sentiment vs official claims → accountability flags.
 *
 * This is the civic analogue of SolVane's TradingAgent, minus the trading tail
 * (price/executor/wallet). Each cycle produces a fully transparent
 * CivicPulseSnapshot that is broadcast on the bus for the live civic terminal
 * and (next milestone) anchored on-chain via the civic_record program.
 */

const PROJECT_VIEWS: CivicProjectView[] = CIVIC_PROJECTS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region,
  officialClaim: p.officialClaim,
}));

export class CivicAgent {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private ticks = 0;
  private inFlight: Promise<CivicPulseSnapshot> | null = null;
  private last: CivicPulseSnapshot | null = null;

  get latest(): CivicPulseSnapshot | null {
    return this.last;
  }

  get engine(): 'claude' | 'heuristic' {
    return civicSentimentService.engine;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info(
      { engine: this.engine, tick: config.agent.tickSeconds, projects: CIVIC_PROJECTS.length },
      'civic agent started',
    );
    void this.tick();
    this.timer = setInterval(() => void this.tick(), config.agent.tickSeconds * 1000);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    logger.info('civic agent stopped');
  }

  /** Force one cycle (manual trigger). */
  async runOnce(): Promise<CivicPulseSnapshot> {
    return this.tick();
  }

  /** Serialize cycles so a slow network tick never overlaps the next. */
  private tick(): Promise<CivicPulseSnapshot> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.runTick().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async runTick(): Promise<CivicPulseSnapshot> {
    this.ticks += 1;
    try {
      // 1. Ingest fresh civic discourse (persists new items; broadcast them).
      const fresh = await newsService.fetchCivic();
      if (fresh.length) bus.emitEvent({ type: 'news', payload: fresh });

      // 2. Score a rolling window of recent stored discourse (not only this
      //    tick's fresh items), so the accountability signal reflects the
      //    accumulated real coverage and survives restarts. Scores are cached.
      const window = recentNews(CIVIC_WINDOW);
      const items = await civicSentimentService.scoreAttributed(window);

      // 3. Accountability flags per project.
      const flags = evaluateAll(items);

      const snapshot: CivicPulseSnapshot = {
        at: Date.now(),
        ticks: this.ticks,
        engine: this.engine,
        usingSimulated: newsService.usingSimulated,
        items,
        flags,
        projects: PROJECT_VIEWS,
      };
      this.last = snapshot;
      bus.emitEvent({ type: 'civic', payload: snapshot });

      const flaggedCount = flags.filter((f) => f.flagged).length;
      logger.info(
        { scored: items.length, flagged: flaggedCount, tick: this.ticks },
        'civic cycle complete',
      );
      return snapshot;
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'civic tick failed');
      throw err;
    }
  }
}

export const civicAgent = new CivicAgent();
