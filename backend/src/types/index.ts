/** Shared domain types used across services, the agent, and the API layer. */

export type Sentiment = 'bullish' | 'bearish' | 'neutral';
export type TradeAction = 'buy' | 'sell' | 'hold';
export type ExecutionMode = 'dry-run' | 'live';

export interface NewsItem {
  id: string; // stable hash of link/title
  title: string;
  summary: string;
  source: string;
  link: string;
  publishedAt: number; // epoch ms
  ingestedAt: number; // epoch ms
}

export interface SentimentResult {
  sentiment: Sentiment;
  /** -1 (max bearish) … +1 (max bullish) */
  score: number;
  /** 0 … 1 model confidence */
  confidence: number;
  rationale: string;
  /** which analyzer produced this: 'claude' | 'heuristic' */
  engine: 'claude' | 'heuristic';
  keyHeadlines: string[];
}

export interface PriceSnapshot {
  mint: string;
  symbol: string;
  priceUsd: number;
  at: number; // epoch ms
  /** 'jupiter' | 'pyth' | 'simulated' | 'sentiment' (news-driven demo) */
  source?: string;
}

export interface TradeDecision {
  id: string;
  at: number;
  action: TradeAction;
  sentiment: SentimentResult;
  price: PriceSnapshot | null;
  /** intended notional in USD (quote token) */
  notionalUsd: number;
  reasons: string[];
  /** true when the decision passed every risk gate and should be executed */
  approved: boolean;
}

export interface TradeRecord {
  id: string;
  decisionId: string;
  at: number;
  action: TradeAction;
  mode: ExecutionMode;
  inputMint: string;
  outputMint: string;
  inAmount: number; // human units
  outAmount: number; // human units (estimated for dry-run)
  priceUsd: number;
  notionalUsd: number;
  slippageBps: number;
  routeLabel: string; // e.g. "Orca → Raydium"
  status: 'simulated' | 'submitted' | 'confirmed' | 'failed';
  signature: string | null;
  error: string | null;
}

export interface Position {
  baseSymbol: string;
  baseMint: string;
  baseAmount: number; // units of base token held
  quoteMint: string;
  quoteAmount: number; // units of quote token (USDC) held
  avgEntryUsd: number;
  realizedPnlUsd: number;
}

export interface AgentStatus {
  running: boolean;
  mode: ExecutionMode;
  aiEngine: 'claude' | 'heuristic';
  cluster: string;
  wallet: string | null;
  lastTickAt: number | null;
  nextTickAt: number | null;
  tickSeconds: number;
  ticks: number;
  cooldownUntil: number | null;
}

/** Flat, wire-canonical decision shape (matches SQLite rows + the live event). */
export interface DecisionDTO {
  id: string;
  at: number;
  action: TradeAction;
  sentiment: Sentiment;
  score: number;
  confidence: number;
  rationale: string;
  engine: 'claude' | 'heuristic';
  priceUsd: number | null;
  notionalUsd: number;
  approved: boolean;
  reasons: string[];
}

/** Any event pushed to WebSocket subscribers. */
export type AgentEvent =
  | { type: 'status'; payload: AgentStatus }
  | { type: 'news'; payload: NewsItem[] }
  | { type: 'sentiment'; payload: SentimentResult }
  | { type: 'price'; payload: PriceSnapshot }
  | { type: 'decision'; payload: DecisionDTO }
  | { type: 'trade'; payload: TradeRecord }
  | { type: 'log'; payload: { level: string; message: string; at: number } };
