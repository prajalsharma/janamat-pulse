import { config } from '../config/index.js';
import { CIVIC_PROJECTS } from '../data/civic-projects.seed.js';
import type { AccountabilityFlag, CivicSentiment } from '../types/civic.js';

/**
 * The accountability engine — Janamat Pulse's replacement for SolVane's risk
 * engine. Where the trading engine asked "should we act on this sentiment?",
 * this asks "does public sentiment contradict the government's official claim?".
 *
 * Government claims are implicitly positive (they assert success/progress), so
 * the accountability gap is how far negative the public reading sits below that.
 * Every flag carries a human-readable summary — the transparent-reasoning
 * contract carried over from the original engine.
 */

/** Average of a numeric field, or 0 for an empty set. */
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Compute the accountability flag for one project given the civic sentiments
 * attributed to it this cycle.
 */
export function evaluateProject(
  projectId: number,
  officialClaim: string,
  sentiments: CivicSentiment[],
): AccountabilityFlag {
  const attributed = sentiments.filter((s) => s.projectId === projectId);
  const sampleSize = attributed.length;

  // Weight each item's sentiment by its confidence so low-confidence noise
  // does not swing the signal.
  const weighted = attributed.map((s) => (s.sentiment * s.confidence) / 100);
  const publicSentiment = Number(avg(weighted.length ? weighted : attributed.map((s) => s.sentiment)).toFixed(1));

  // Official stance is treated as fully positive (+100). Gap is the normalized
  // distance between that and the public reading (0..100).
  const gap = Number((Math.abs(100 - publicSentiment) / 2).toFixed(1));

  const flagged =
    sampleSize >= config.civic.minSample && publicSentiment <= config.civic.flagThreshold;

  const summary = buildSummary(publicSentiment, sampleSize, flagged, gap);

  return { projectId, officialClaim, publicSentiment, sampleSize, flagged, gap, summary };
}

function buildSummary(
  publicSentiment: number,
  sampleSize: number,
  flagged: boolean,
  gap: number,
): string {
  if (sampleSize === 0) {
    return 'No attributed public discourse this cycle — no accountability signal yet.';
  }
  if (sampleSize < config.civic.minSample) {
    return `Only ${sampleSize} attributed item(s); below the ${config.civic.minSample}-item floor for a reliable flag.`;
  }
  if (flagged) {
    return `Public sentiment ${publicSentiment} materially disputes the official claim (gap ${gap}/100 across ${sampleSize} items). Accountability gap flagged.`;
  }
  if (publicSentiment >= 20) {
    return `Public sentiment ${publicSentiment} broadly corroborates the official claim across ${sampleSize} items.`;
  }
  return `Public sentiment ${publicSentiment} is mixed across ${sampleSize} items; no clear gap.`;
}

/** Evaluate every tracked project against this cycle's civic sentiments. */
export function evaluateAll(sentiments: CivicSentiment[]): AccountabilityFlag[] {
  return CIVIC_PROJECTS.map((p) => evaluateProject(p.id, p.officialClaim, sentiments));
}
