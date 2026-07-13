import type { TradeDecision, DecisionDTO } from '../types/index.js';

export type { DecisionDTO };

/**
 * Canonical, flat decision shape shared by BOTH the REST/WS snapshot (which
 * reads flat rows from SQLite) and the live `decision` event. Having one shape
 * on the wire is what prevents the "nested vs flat" class of UI bug.
 */
export function decisionDTO(d: TradeDecision): DecisionDTO {
  return {
    id: d.id,
    at: d.at,
    action: d.action,
    sentiment: d.sentiment.sentiment,
    score: d.sentiment.score,
    confidence: d.sentiment.confidence,
    rationale: d.sentiment.rationale,
    engine: d.sentiment.engine,
    priceUsd: d.price?.priceUsd ?? null,
    notionalUsd: d.notionalUsd,
    approved: d.approved,
    reasons: d.reasons,
  };
}
