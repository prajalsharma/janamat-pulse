/**
 * Janamat Pulse — civic domain types.
 *
 * This replaces SolVane's trading types. The agent classifies civic discourse
 * about tracked government projects, scores public sentiment, and extracts the
 * claim it is reacting to so the accountability engine can diff public sentiment
 * against the government's OFFICIAL claim (see `official_claim` on-chain).
 */

/** Mirrors the `category: u8` field in the civic_record Anchor program. */
export enum CivicCategory {
  Infrastructure = 0,
  Water = 1,
  Aviation = 2,
  Policy = 3,
  Governance = 4,
}

/** A government project tracked on-chain (registered via `register_project`). */
export interface CivicProject {
  /** on-chain u32 project id (PDA seed) */
  id: number;
  name: string;
  category: CivicCategory;
  /** region/constituency for sentiment segmentation (Janamat-style) */
  region: string;
  /** the government's officially asserted milestone/status */
  officialClaim: string;
  /** matcher terms the agent uses to attribute a headline to this project */
  keywords: string[];
}

/** How a piece of public discourse relates to the official claim. */
export type Stance = 'corroborates' | 'disputes' | 'neutral';

/**
 * The LLM's structured read of one civic news/discourse item. This is the civic
 * analogue of SolVane's sentiment output — same transparent-reasoning contract.
 */
export interface CivicSentiment {
  /** which tracked project this item concerns, or null if none */
  projectId: number | null;
  category: CivicCategory;
  /** the primary actor/institution referenced (ministry, contractor, official) */
  actor: string | null;
  /** -100 (public disputes/criticises) .. +100 (public corroborates) */
  sentiment: number;
  /** 0..100 model confidence */
  confidence: number;
  /** the concrete claim about status/funding/milestone the item reacts to */
  claim: string | null;
  /** stance of public sentiment vs the project's official claim */
  stance: Stance;
  /** transparent one-paragraph justification (persisted + streamed to UI) */
  rationale: string;
}

/**
 * Accountability signal for a project: the gap between what the government
 * claims and what the public sentiment says. Produced by the accountability
 * engine (the civic replacement for SolVane's risk engine).
 */
export interface AccountabilityFlag {
  projectId: number;
  officialClaim: string;
  /** average public sentiment across attributed items (-100..100) */
  publicSentiment: number;
  /** number of attributed discourse items */
  sampleSize: number;
  /** true when public sentiment materially contradicts the official claim */
  flagged: boolean;
  /** magnitude of the claim-vs-sentiment divergence (0..100) */
  gap: number;
  summary: string;
}
