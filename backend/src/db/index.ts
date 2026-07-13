import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { NewsItem, TradeDecision, TradeRecord } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'solvane.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT,
    link TEXT,
    publishedAt INTEGER,
    ingestedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    at INTEGER,
    action TEXT,
    sentiment TEXT,       -- 'bullish'|'bearish'|'neutral'
    score REAL,
    confidence REAL,
    rationale TEXT,
    engine TEXT,
    priceUsd REAL,
    notionalUsd REAL,
    approved INTEGER,
    reasons TEXT          -- JSON array
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    decisionId TEXT,
    at INTEGER,
    action TEXT,
    mode TEXT,
    inputMint TEXT,
    outputMint TEXT,
    inAmount REAL,
    outAmount REAL,
    priceUsd REAL,
    notionalUsd REAL,
    slippageBps INTEGER,
    routeLabel TEXT,
    status TEXT,
    signature TEXT,
    error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_news_ingested ON news(ingestedAt DESC);
  CREATE INDEX IF NOT EXISTS idx_decisions_at ON decisions(at DESC);
  CREATE INDEX IF NOT EXISTS idx_trades_at ON trades(at DESC);
`);

// ── News ────────────────────────────────────────────────────────────────────
const insertNews = db.prepare(`
  INSERT OR IGNORE INTO news (id, title, summary, source, link, publishedAt, ingestedAt)
  VALUES (@id, @title, @summary, @source, @link, @publishedAt, @ingestedAt)
`);

export function saveNews(items: NewsItem[]): NewsItem[] {
  const fresh: NewsItem[] = [];
  const tx = db.transaction((rows: NewsItem[]) => {
    for (const row of rows) {
      const res = insertNews.run(row);
      if (res.changes > 0) fresh.push(row);
    }
  });
  tx(items);
  return fresh; // only rows that were genuinely new
}

export function recentNews(limit = 50): NewsItem[] {
  return db
    .prepare('SELECT * FROM news ORDER BY ingestedAt DESC LIMIT ?')
    .all(limit) as NewsItem[];
}

// ── Decisions ───────────────────────────────────────────────────────────────
const insertDecision = db.prepare(`
  INSERT OR REPLACE INTO decisions
    (id, at, action, sentiment, score, confidence, rationale, engine, priceUsd, notionalUsd, approved, reasons)
  VALUES
    (@id, @at, @action, @sentiment, @score, @confidence, @rationale, @engine, @priceUsd, @notionalUsd, @approved, @reasons)
`);

export function saveDecision(d: TradeDecision): void {
  insertDecision.run({
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
    approved: d.approved ? 1 : 0,
    reasons: JSON.stringify(d.reasons),
  });
}

export function recentDecisions(limit = 50): any[] {
  return db
    .prepare('SELECT * FROM decisions ORDER BY at DESC LIMIT ?')
    .all(limit)
    .map((r: any) => ({ ...r, approved: !!r.approved, reasons: JSON.parse(r.reasons || '[]') }));
}

// ── Trades ──────────────────────────────────────────────────────────────────
const insertTrade = db.prepare(`
  INSERT OR REPLACE INTO trades
    (id, decisionId, at, action, mode, inputMint, outputMint, inAmount, outAmount,
     priceUsd, notionalUsd, slippageBps, routeLabel, status, signature, error)
  VALUES
    (@id, @decisionId, @at, @action, @mode, @inputMint, @outputMint, @inAmount, @outAmount,
     @priceUsd, @notionalUsd, @slippageBps, @routeLabel, @status, @signature, @error)
`);

export function saveTrade(t: TradeRecord): void {
  insertTrade.run(t);
}

export function recentTrades(limit = 100): TradeRecord[] {
  return db
    .prepare('SELECT * FROM trades ORDER BY at DESC LIMIT ?')
    .all(limit) as TradeRecord[];
}

export function allTrades(): TradeRecord[] {
  return db.prepare('SELECT * FROM trades ORDER BY at ASC').all() as TradeRecord[];
}

export default db;
