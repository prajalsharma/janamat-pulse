'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AgentStatus,
  DecisionRow,
  NewsItem,
  Portfolio,
  PriceSnapshot,
  SentimentResult,
  TradeRow,
} from './types';

type Conn = 'connecting' | 'live' | 'offline';

interface StreamState {
  conn: Conn;
  status: AgentStatus | null;
  news: NewsItem[];
  decisions: DecisionRow[];
  trades: TradeRow[];
  sentiment: SentimentResult | null;
  price: PriceSnapshot | null;
  prices: PriceSnapshot[]; // sparkline history
  portfolio: Portfolio | null;
}

function wsUrl(): string {
  if (typeof window === 'undefined') return '';
  // Production: point at the hosted backend via NEXT_PUBLIC_WS_URL, e.g.
  // wss://your-backend.onrender.com/ws (set in the Vercel project env).
  // Local dev: default to the backend on :4000 of the current host.
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured && configured.length > 0) return configured;
  const host = window.location.hostname;
  return `ws://${host}:4000/ws`;
}

/**
 * Defensive normalizer: accepts either the flat DTO or a legacy nested
 * decision and always returns a fully-populated flat DecisionRow, so the UI
 * can never crash on `undefined.toFixed`.
 */
function normalizeDecision(raw: any): DecisionRow {
  const nested = raw?.sentiment && typeof raw.sentiment === 'object' ? raw.sentiment : null;
  return {
    id: raw?.id ?? '',
    at: raw?.at ?? Date.now(),
    action: raw?.action ?? 'hold',
    sentiment: nested ? nested.sentiment : raw?.sentiment ?? 'neutral',
    score: Number(nested ? nested.score : raw?.score) || 0,
    confidence: Number(nested ? nested.confidence : raw?.confidence) || 0,
    rationale: nested ? nested.rationale : raw?.rationale ?? '',
    engine: nested ? nested.engine : raw?.engine ?? 'heuristic',
    priceUsd: raw?.priceUsd ?? raw?.price?.priceUsd ?? null,
    notionalUsd: Number(raw?.notionalUsd) || 0,
    approved: !!raw?.approved,
    reasons: Array.isArray(raw?.reasons) ? raw.reasons : [],
  };
}

const MAX = 60;

export function useAgentStream() {
  const [s, setS] = useState<StreamState>({
    conn: 'connecting',
    status: null,
    news: [],
    decisions: [],
    trades: [],
    sentiment: null,
    price: null,
    prices: [],
    portfolio: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPortfolio = useCallback(async () => {
    try {
      const r = await fetch('/api/portfolio');
      if (r.ok) {
        const portfolio = await r.json();
        setS((p) => ({ ...p, portfolio }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => setS((p) => ({ ...p, conn: 'live' }));

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        setS((p) => {
          switch (msg.type) {
            case 'status':
              return { ...p, status: msg.payload };
            case 'snapshot': {
              const decisions = (msg.payload.decisions ?? []).map(normalizeDecision);
              // Hydrate the hero panels from the most recent decision so the
              // dashboard is populated on first paint, before the next live tick.
              const latest = decisions[0];
              const sentiment: SentimentResult | null = latest
                ? {
                    sentiment: latest.sentiment,
                    score: latest.score,
                    confidence: latest.confidence,
                    rationale: latest.rationale,
                    engine: latest.engine,
                    keyHeadlines: [],
                  }
                : p.sentiment;
              // Only seed the sparkline from the last 20 minutes of samples so
              // stale demo history doesn't distort the session change %.
              const cutoff = Date.now() - 20 * 60 * 1000;
              const seedPrices: PriceSnapshot[] = decisions
                .filter((d: DecisionRow) => d.priceUsd != null && d.at >= cutoff)
                .slice(0, 30)
                .reverse()
                .map((d: DecisionRow) => ({
                  mint: '',
                  symbol: 'SOL',
                  priceUsd: d.priceUsd as number,
                  at: d.at,
                }));
              return {
                ...p,
                news: msg.payload.news ?? [],
                decisions,
                trades: msg.payload.trades ?? [],
                sentiment,
                price: seedPrices.at(-1) ?? p.price,
                prices: seedPrices.length ? seedPrices : p.prices,
              };
            }
            case 'news':
              return { ...p, news: [...msg.payload, ...p.news].slice(0, MAX) };
            case 'sentiment':
              return { ...p, sentiment: msg.payload };
            case 'price':
              return {
                ...p,
                price: msg.payload,
                prices: [...p.prices, msg.payload].slice(-MAX),
              };
            case 'decision':
              return { ...p, decisions: [normalizeDecision(msg.payload), ...p.decisions].slice(0, MAX) };
            case 'trade':
              return { ...p, trades: [msg.payload, ...p.trades].slice(0, MAX) };
            default:
              return p;
          }
        });
        if (msg.type === 'trade') void refreshPortfolio();
      };

      ws.onclose = () => {
        setS((p) => ({ ...p, conn: 'offline' }));
        retryRef.current = setTimeout(connect, 2500);
      };
      ws.onerror = () => ws.close();
    } catch {
      setS((p) => ({ ...p, conn: 'offline' }));
      retryRef.current = setTimeout(connect, 2500);
    }
  }, [refreshPortfolio]);

  useEffect(() => {
    connect();
    void refreshPortfolio();
    const poll = setInterval(refreshPortfolio, 15000);
    return () => {
      clearInterval(poll);
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect, refreshPortfolio]);

  const control = useCallback(async (path: 'start' | 'stop' | 'tick') => {
    try {
      await fetch(`/api/agent/${path}`, { method: 'POST' });
    } catch {
      /* ignore */
    }
  }, []);

  return { ...s, control };
}
