import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { attributeProject, CIVIC_PROJECTS } from '../data/civic-projects.seed.js';
import { CivicCategory, type CivicSentiment, type Stance } from '../types/civic.js';
import type { NewsItem } from '../types/index.js';

/**
 * Civic sentiment analysis — the Janamat Pulse analogue of SolVane's trading
 * sentiment. For each news/discourse item the agent:
 *   1. attributes it to a tracked government project (deterministic keywords),
 *   2. scores how the PUBLIC feels relative to that project's OFFICIAL claim
 *      (-100 disputes … +100 corroborates), with a transparent rationale.
 *
 * Two tiers, mirroring the original engine:
 *   • Claude (when ANTHROPIC_API_KEY set) — nuanced, claim-aware.
 *   • Deterministic lexical scorer — always available, keyless, free.
 */

const client = config.ai.enabled ? new Anthropic({ apiKey: config.ai.apiKey }) : null;

const SYSTEM = `You are Janamat Pulse, a neutral civic-accountability analyst for Nepal.
You read news and public discourse about specific government projects and judge PUBLIC SENTIMENT relative to the government's official claim.
Be neutral and evidence-driven: you are measuring public opinion, not asserting facts yourself.
Negative sentiment = the public disputes, criticises, or contradicts the official claim (delays, corruption, non-delivery, protest).
Positive sentiment = the public corroborates the official claim (delivered, operational, on schedule).
Respond ONLY with a single JSON object, no prose, matching exactly:
{"sentiment":<int -100..100>,"confidence":<int 0..100>,"actor":"<institution/official or null>","claim":"<the concrete status/funding claim the item reacts to, or null>","stance":"corroborates|disputes|neutral","rationale":"<one neutral sentence>"}`;

// ── Lexical fallback lexicons (civic) ────────────────────────────────────────
const DISPUTE = [
  'delay', 'delayed', 'stalled', 'stall', 'incomplete', 'unfinished', 'corruption',
  'corrupt', 'scam', 'irregularit', 'embezzle', 'protest', 'anger', 'outrage', 'failure',
  'failed', 'defect', 'crack', 'leak', 'dry', 'shortage', 'overrun', 'cost overrun',
  'missing', 'halt', 'suspend', 'mismanage', 'probe', 'investigat', 'lawsuit', 'debt',
  'loss', 'idle', 'underutil', 'empty', 'broken', 'dispute', 'criticis', 'criticiz',
];
const CORROBORATE = [
  'complete', 'completed', 'operational', 'delivered', 'inaugurat', 'on schedule',
  'on track', 'functional', 'success', 'milestone', 'progress', 'resumed', 'restored',
  'handed over', 'commission', 'opened', 'launch', 'ahead of schedule',
];

function heuristicScore(text: string): { sentiment: number; confidence: number } {
  const hay = text.toLowerCase();
  let score = 0;
  let hits = 0;
  for (const w of DISPUTE) if (hay.includes(w)) { score -= 1; hits += 1; }
  for (const w of CORROBORATE) if (hay.includes(w)) { score += 1; hits += 1; }
  // Normalize to -100..100; saturate around a few strong hits.
  const sentiment = Math.max(-100, Math.min(100, Math.round((score / 3) * 100)));
  const confidence = Math.max(0, Math.min(100, Math.round((hits / 4) * 100)));
  return { sentiment, confidence };
}

function stanceOf(sentiment: number): Stance {
  if (sentiment <= -20) return 'disputes';
  if (sentiment >= 20) return 'corroborates';
  return 'neutral';
}

function heuristic(item: NewsItem, projectId: number | null, category: CivicCategory): CivicSentiment {
  const text = `${item.title} ${item.summary}`;
  const { sentiment, confidence } = heuristicScore(text);
  return {
    projectId,
    category,
    actor: null,
    sentiment,
    confidence,
    claim: null,
    stance: stanceOf(sentiment),
    rationale:
      confidence === 0
        ? 'No strong civic signal detected in the item.'
        : `Lexical civic signal ${sentiment >= 0 ? 'corroborating' : 'disputing'} the official claim.`,
  };
}

// ── Claude tier ──────────────────────────────────────────────────────────────
function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON in model output');
  return JSON.parse(text.slice(start, end + 1));
}

function clampInt(n: unknown, lo: number, hi: number): number {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return 0;
  return Math.max(lo, Math.min(hi, v));
}

async function withClaude(
  item: NewsItem,
  projectId: number | null,
  category: CivicCategory,
  officialClaim: string | null,
): Promise<CivicSentiment> {
  const context = officialClaim
    ? `Government's official claim about this project: "${officialClaim}"`
    : 'No specific tracked project; score general civic sentiment.';

  const msg = await client!.messages.create({
    model: config.ai.model,
    max_tokens: 300,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `${context}\n\nItem [${item.source}]: ${item.title}${item.summary ? `\n${item.summary}` : ''}\n\nReturn the JSON verdict.`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const p = extractJson(text);
  const sentiment = clampInt(p.sentiment, -100, 100);
  const stance: Stance = ['corroborates', 'disputes', 'neutral'].includes(p.stance)
    ? p.stance
    : stanceOf(sentiment);

  return {
    projectId,
    category,
    actor: p.actor ? String(p.actor).slice(0, 80) : null,
    sentiment,
    confidence: clampInt(p.confidence, 0, 100),
    claim: p.claim ? String(p.claim).slice(0, 200) : null,
    stance,
    rationale: String(p.rationale ?? '').slice(0, 300),
  };
}

export class CivicSentimentService {
  readonly engine: 'claude' | 'heuristic' = config.ai.enabled ? 'claude' : 'heuristic';

  /** Attribute + score a single item. */
  async scoreItem(item: NewsItem): Promise<CivicSentiment> {
    const project = attributeProject(`${item.title} ${item.summary}`);
    const projectId = project?.id ?? null;
    const category = project?.category ?? CivicCategory.Governance;
    const officialClaim = project?.officialClaim ?? null;

    if (client) {
      try {
        return await withClaude(item, projectId, category, officialClaim);
      } catch (err) {
        logger.warn(
          { err: (err as Error).message },
          'Claude civic sentiment failed — falling back to heuristic',
        );
      }
    }
    return heuristic(item, projectId, category);
  }

  /** Score a batch, preserving order. */
  async scoreBatch(items: NewsItem[]): Promise<CivicSentiment[]> {
    return Promise.all(items.map((i) => this.scoreItem(i)));
  }

  /** Only items attributable to a tracked project (drives accountability). */
  async scoreAttributed(items: NewsItem[]): Promise<CivicSentiment[]> {
    const attributed = items.filter(
      (i) => attributeProject(`${i.title} ${i.summary}`) !== null,
    );
    return this.scoreBatch(attributed);
  }
}

export const civicSentimentService = new CivicSentimentService();

/** Convenience: the tracked-project registry, re-exported for callers. */
export { CIVIC_PROJECTS };
