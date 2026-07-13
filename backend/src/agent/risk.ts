import { config } from '../config/index.js';
import type { PriceSnapshot, SentimentResult, TradeAction } from '../types/index.js';

export interface RiskContext {
  sentiment: SentimentResult;
  price: PriceSnapshot | null;
  lastPrice: PriceSnapshot | null;
  cooldownUntil: number | null;
  now: number;
  hasWallet: boolean;
}

export interface RiskVerdict {
  action: TradeAction;
  approved: boolean;
  notionalUsd: number;
  reasons: string[];
}

/**
 * Deterministic risk engine. The LLM proposes; the risk engine disposes.
 * Every gate that fails is recorded as a human-readable reason, which is what
 * the dashboard surfaces so a decision is never a black box.
 */
export function evaluate(ctx: RiskContext): RiskVerdict {
  const reasons: string[] = [];
  const { sentiment, price, lastPrice, cooldownUntil, now } = ctx;

  // 1. Map sentiment → intended direction.
  const action: TradeAction =
    sentiment.sentiment === 'bullish' ? 'buy' : sentiment.sentiment === 'bearish' ? 'sell' : 'hold';

  if (action === 'hold') {
    reasons.push('Sentiment neutral, no directional edge.');
    return { action, approved: false, notionalUsd: 0, reasons };
  }

  let approved = true;

  // 2. Confidence gate.
  if (sentiment.confidence < config.trade.minConfidence) {
    approved = false;
    reasons.push(
      `Confidence ${(sentiment.confidence * 100).toFixed(0)}% below ${(config.trade.minConfidence * 100).toFixed(0)}% threshold.`,
    );
  } else {
    reasons.push(`Confidence ${(sentiment.confidence * 100).toFixed(0)}% clears threshold.`);
  }

  // 3. Price availability + movement gate (avoid trading on stale/flat tape).
  if (!price) {
    approved = false;
    reasons.push('No live price available, cannot size or verify the trade.');
  } else if (lastPrice) {
    const movePct = Math.abs((price.priceUsd - lastPrice.priceUsd) / lastPrice.priceUsd) * 100;
    if (movePct < config.trade.minPriceMovePct) {
      approved = false;
      reasons.push(
        `Price move ${movePct.toFixed(2)}% under ${config.trade.minPriceMovePct}% activity floor.`,
      );
    } else {
      reasons.push(`Price move ${movePct.toFixed(2)}% confirms market activity.`);
    }
  } else {
    reasons.push('First price sample, movement check deferred.');
  }

  // 4. Cooldown gate (rate-limit churn).
  if (cooldownUntil && now < cooldownUntil) {
    approved = false;
    const secs = Math.ceil((cooldownUntil - now) / 1000);
    reasons.push(`Cooldown active. ${secs}s until next trade permitted.`);
  }

  // 5. Position sizing: scale notional by confidence, capped by MAX_TRADE_USD.
  const notionalUsd = Number(
    (config.trade.maxTradeUsd * Math.min(1, sentiment.confidence)).toFixed(2),
  );
  if (approved) {
    reasons.push(`Sized ${action.toUpperCase()} at $${notionalUsd} (conf-scaled, cap $${config.trade.maxTradeUsd}).`);
  }

  return { action, approved, notionalUsd, reasons };
}
