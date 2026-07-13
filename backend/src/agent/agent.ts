import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { stableId } from '../utils/hash.js';
import { newsService } from '../services/news.js';
import { sentimentService } from '../services/sentiment.js';
import { priceService } from '../services/price.js';
import { executorService } from '../services/executor.js';
import { walletService } from '../services/wallet.js';
import { evaluate } from './risk.js';
import { bus } from './bus.js';
import { decisionDTO } from '../api/dto.js';
import { recentNews, saveDecision, saveTrade } from '../db/index.js';
import type {
  AgentStatus,
  PriceSnapshot,
  SentimentResult,
  TradeDecision,
} from '../types/index.js';

/**
 * The orchestrator. One tick =
 *   ingest news → score sentiment → sample price → risk-gate → (maybe) execute.
 * Everything it produces is persisted and broadcast on the bus so the dashboard
 * shows the full reasoning chain, not just the outcome.
 */
export class TradingAgent {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private ticks = 0;
  private lastTickAt: number | null = null;
  private lastPrice: PriceSnapshot | null = null;
  private lastSentiment: SentimentResult | null = null;
  private cooldownUntil: number | null = null;
  private inFlight: Promise<TradeDecision> | null = null;

  status(): AgentStatus {
    return {
      running: this.running,
      mode: config.executionMode,
      aiEngine: sentimentService.engine,
      cluster: config.solana.cluster,
      wallet: walletService.publicKey,
      lastTickAt: this.lastTickAt,
      nextTickAt: this.running && this.lastTickAt
        ? this.lastTickAt + config.agent.tickSeconds * 1000
        : null,
      tickSeconds: config.agent.tickSeconds,
      ticks: this.ticks,
      cooldownUntil: this.cooldownUntil,
    };
  }

  private broadcastStatus() {
    bus.emitEvent({ type: 'status', payload: this.status() });
  }

  start() {
    if (this.running) return;
    this.running = true;
    logger.info(
      { mode: config.executionMode, engine: sentimentService.engine, tick: config.agent.tickSeconds },
      'agent started',
    );
    this.broadcastStatus();
    void this.tick(); // fire immediately, then on cadence
    this.timer = setInterval(() => void this.tick(), config.agent.tickSeconds * 1000);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    logger.info('agent stopped');
    this.broadcastStatus();
  }

  /** Force a single evaluation cycle (used by the API's manual trigger). */
  async runOnce(): Promise<TradeDecision> {
    return this.tick();
  }

  /**
   * Serialize evaluation cycles. The interval fire and the manual API trigger
   * both call this; without a guard a slow tick (network) could overlap the
   * next one and corrupt shared state (lastPrice, cooldownUntil, ticks). An
   * overlapping caller simply rides the in-flight cycle instead of racing it.
   */
  private tick(): Promise<TradeDecision> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.runTick().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async runTick(): Promise<TradeDecision> {
    this.ticks += 1;
    this.lastTickAt = Date.now();
    try {
      // 1. News
      const fresh = await newsService.fetchLatest();
      if (fresh.length) bus.emitEvent({ type: 'news', payload: fresh });
      const stored = recentNews(20);
      const corpus = stored.length ? stored : fresh;

      // 2. Sentiment
      const sentiment = await sentimentService.analyze(corpus);
      this.lastSentiment = sentiment;
      bus.emitEvent({ type: 'sentiment', payload: sentiment });

      // 3. Price (news-driven in sentiment mode: the score steers the drift)
      const price = await priceService.getPrice(config.trade.baseMint, sentiment.score);
      bus.emitEvent({ type: 'price', payload: price });

      // 4. Risk gate
      const verdict = evaluate({
        sentiment,
        price,
        lastPrice: this.lastPrice,
        cooldownUntil: this.cooldownUntil,
        now: Date.now(),
        hasWallet: walletService.publicKey != null,
      });

      const decision: TradeDecision = {
        id: stableId('decision', this.lastTickAt, sentiment.score),
        at: Date.now(),
        action: verdict.action,
        sentiment,
        price,
        notionalUsd: verdict.notionalUsd,
        reasons: verdict.reasons,
        approved: verdict.approved,
      };
      saveDecision(decision);
      // Emit the FLAT canonical DTO - identical shape to the REST/WS snapshot,
      // so the UI never has to branch on nested-vs-flat decision payloads.
      bus.emitEvent({ type: 'decision', payload: decisionDTO(decision) });
      logger.info(
        { action: decision.action, approved: decision.approved, score: sentiment.score },
        'decision',
      );

      // 5. Execute if approved
      if (decision.approved && verdict.action !== 'hold') {
        const trade = await executorService.execute(decision);
        saveTrade(trade);
        bus.emitEvent({ type: 'trade', payload: trade });
        this.cooldownUntil = Date.now() + config.trade.cooldownSeconds * 1000;
      }

      this.lastPrice = price;
      this.broadcastStatus();
      return decision;
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'tick failed');
      this.broadcastStatus();
      throw err;
    }
  }
}

export const agent = new TradingAgent();
