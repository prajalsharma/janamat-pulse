import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { NewsItem, SentimentResult, Sentiment } from '../types/index.js';

/**
 * Two-tier sentiment analysis:
 *  1. Claude (when ANTHROPIC_API_KEY is set) - nuanced, returns structured JSON.
 *  2. Deterministic lexical scorer - always available, keeps the agent live
 *     with zero external dependencies or cost.
 */

const client = config.ai.enabled ? new Anthropic({ apiKey: config.ai.apiKey }) : null;

const SYSTEM = `You are SolVane, a disciplined crypto trading analyst focused on the Solana ecosystem.
You read recent headlines and judge the NET short-term price impact on SOL.
You are skeptical: hype, vague rumors, and clickbait get low confidence.
Concrete catalysts (major listings, protocol launches, hacks, outages, regulatory rulings) get high confidence.
Respond ONLY with a single JSON object, no prose, matching exactly:
{"sentiment":"bullish|bearish|neutral","score":<float -1..1>,"confidence":<float 0..1>,"rationale":"<one sentence>","keyHeadlines":["<up to 3 most decision-relevant headlines>"]}`;

// ── Lexical fallback ─────────────────────────────────────────────────────────
const BULLISH = [
  'surge', 'rally', 'soar', 'record', 'all-time high', 'ath', 'launch', 'partnership',
  'listing', 'adoption', 'upgrade', 'inflow', 'bullish', 'breakout', 'demand', 'growth',
  'integration', 'milestone', 'approval', 'gains', 'rebound', 'accumulate',
];
const BEARISH = [
  'hack', 'exploit', 'outage', 'downtime', 'crash', 'plunge', 'dump', 'sell-off', 'selloff',
  'lawsuit', 'ban', 'sec', 'investigation', 'bearish', 'liquidation', 'rug', 'drain', 'decline',
  'fear', 'caution', 'pullback', 'warning', 'halt', 'delist', 'fraud', 'collapse',
];

function heuristic(items: NewsItem[]): SentimentResult {
  let score = 0;
  let hits = 0;
  const scored: { title: string; weight: number }[] = [];

  for (const item of items) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    let local = 0;
    for (const w of BULLISH) if (text.includes(w)) local += 1;
    for (const w of BEARISH) if (text.includes(w)) local -= 1.2; // weight risk slightly heavier
    if (local !== 0) {
      hits += Math.abs(local);
      scored.push({ title: item.title, weight: local });
    }
    score += local;
  }

  const norm = Math.max(-1, Math.min(1, score / Math.max(6, items.length)));
  const sentiment: Sentiment = norm > 0.12 ? 'bullish' : norm < -0.12 ? 'bearish' : 'neutral';
  const confidence = Math.max(0, Math.min(1, hits / (items.length * 1.5 || 1)));

  const keyHeadlines = scored
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 3)
    .map((s) => s.title);

  return {
    sentiment,
    score: Number(norm.toFixed(3)),
    confidence: Number(confidence.toFixed(3)),
    rationale:
      hits === 0
        ? 'No strong catalysts detected in recent headlines.'
        : `Lexical signal net ${norm > 0 ? 'positive' : 'negative'} across ${items.length} headlines.`,
    engine: 'heuristic',
    keyHeadlines,
  };
}

// ── Claude tier ──────────────────────────────────────────────────────────────
function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON in model output');
  return JSON.parse(text.slice(start, end + 1));
}

async function withClaude(items: NewsItem[]): Promise<SentimentResult> {
  const headlines = items
    .slice(0, 20)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}${n.summary ? ` - ${n.summary}` : ''}`)
    .join('\n');

  const msg = await client!.messages.create({
    model: config.ai.model,
    max_tokens: 400,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Recent Solana-ecosystem headlines:\n\n${headlines}\n\nReturn the JSON verdict.`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed = extractJson(text);
  const score = Math.max(-1, Math.min(1, Number(parsed.score)));
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence)));
  const sentiment: Sentiment = ['bullish', 'bearish', 'neutral'].includes(parsed.sentiment)
    ? parsed.sentiment
    : score > 0.12
      ? 'bullish'
      : score < -0.12
        ? 'bearish'
        : 'neutral';

  return {
    sentiment,
    score: Number(score.toFixed(3)),
    confidence: Number(confidence.toFixed(3)),
    rationale: String(parsed.rationale ?? '').slice(0, 300),
    engine: 'claude',
    keyHeadlines: Array.isArray(parsed.keyHeadlines) ? parsed.keyHeadlines.slice(0, 3) : [],
  };
}

export class SentimentService {
  readonly engine: 'claude' | 'heuristic' = config.ai.enabled ? 'claude' : 'heuristic';

  async analyze(items: NewsItem[]): Promise<SentimentResult> {
    if (items.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        rationale: 'No headlines to analyze.',
        engine: this.engine,
        keyHeadlines: [],
      };
    }

    if (client) {
      try {
        return await withClaude(items);
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Claude sentiment failed - falling back to heuristic');
        return heuristic(items);
      }
    }
    return heuristic(items);
  }
}

export const sentimentService = new SentimentService();
