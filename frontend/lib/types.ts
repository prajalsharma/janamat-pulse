export type Sentiment = 'bullish' | 'bearish' | 'neutral';
export type TradeAction = 'buy' | 'sell' | 'hold';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  link: string;
  publishedAt: number;
  ingestedAt: number;
}

export interface DecisionRow {
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

export interface TradeRow {
  id: string;
  decisionId: string;
  at: number;
  action: TradeAction;
  mode: 'dry-run' | 'live';
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  priceUsd: number;
  notionalUsd: number;
  slippageBps: number;
  routeLabel: string;
  status: 'simulated' | 'submitted' | 'confirmed' | 'failed';
  signature: string | null;
  error: string | null;
}

export interface AgentStatus {
  running: boolean;
  mode: 'dry-run' | 'live';
  aiEngine: 'claude' | 'heuristic';
  cluster: string;
  wallet: string | null;
  lastTickAt: number | null;
  nextTickAt: number | null;
  tickSeconds: number;
  ticks: number;
  cooldownUntil: number | null;
}

export interface Portfolio {
  baseSymbol: string;
  baseAmount: number;
  quoteSpent: number;
  avgEntryUsd: number;
  markPriceUsd: number;
  marketValueUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  totalPnlUsd: number;
  tradeCount: number;
  winRate: number;
  onchainSol: number | null;
}

export interface SentimentResult {
  sentiment: Sentiment;
  score: number;
  confidence: number;
  rationale: string;
  engine: 'claude' | 'heuristic';
  keyHeadlines: string[];
}

export interface PriceSnapshot {
  mint: string;
  symbol: string;
  priceUsd: number;
  at: number;
  source?: string; // 'jupiter' | 'pyth' | 'simulated' | 'sentiment'
}
