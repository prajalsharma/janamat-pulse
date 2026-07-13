/**
 * Seeds a handful of decisions + simulated trades so the dashboard has history
 * on first launch. Safe to run repeatedly (ids are content-stable).
 */
import { stableId } from '../utils/hash.js';
import { saveDecision, saveTrade } from '../db/index.js';
import { config } from '../config/index.js';
import type { TradeDecision, TradeRecord } from '../types/index.js';

const now = Date.now();
const samples: { min: number; action: 'buy' | 'sell'; score: number; conf: number; note: string; price: number }[] = [
  { min: 45, action: 'buy', score: 0.62, conf: 0.78, note: 'Record NFT mint volume + Jupiter ATH swaps.', price: 148.2 },
  { min: 32, action: 'sell', score: -0.41, conf: 0.71, note: 'Funding-rate spike; desks flag crowded longs.', price: 151.6 },
  { min: 18, action: 'buy', score: 0.55, conf: 0.69, note: 'Major exchange lists SOL perp; inflows rising.', price: 149.9 },
];

for (const s of samples) {
  const at = now - s.min * 60_000;
  const decision: TradeDecision = {
    id: stableId('seed-decision', s.min),
    at,
    action: s.action,
    sentiment: {
      sentiment: s.score > 0 ? 'bullish' : 'bearish',
      score: s.score,
      confidence: s.conf,
      rationale: s.note,
      engine: 'heuristic',
      keyHeadlines: [s.note],
    },
    price: { mint: config.trade.baseMint, symbol: 'SOL', priceUsd: s.price, at },
    notionalUsd: Number((config.trade.maxTradeUsd * s.conf).toFixed(2)),
    reasons: ['Seeded demo decision.', `Confidence ${(s.conf * 100).toFixed(0)}% clears threshold.`],
    approved: true,
  };
  saveDecision(decision);

  const solAmt = decision.notionalUsd / s.price;
  const trade: TradeRecord = {
    id: stableId('seed-trade', s.min),
    decisionId: decision.id,
    at,
    action: s.action,
    mode: 'dry-run',
    inputMint: s.action === 'buy' ? config.trade.quoteMint : config.trade.baseMint,
    outputMint: s.action === 'buy' ? config.trade.baseMint : config.trade.quoteMint,
    inAmount: s.action === 'buy' ? decision.notionalUsd : Number(solAmt.toFixed(4)),
    outAmount: s.action === 'buy' ? Number(solAmt.toFixed(4)) : decision.notionalUsd,
    priceUsd: s.price,
    notionalUsd: decision.notionalUsd,
    slippageBps: config.trade.maxSlippageBps,
    routeLabel: s.action === 'buy' ? 'Orca → Raydium' : 'Meteora → Orca',
    status: 'simulated',
    signature: null,
    error: null,
  };
  saveTrade(trade);
}

// eslint-disable-next-line no-console
console.log(`Seeded ${samples.length} decisions + trades.`);
