'use client';

import { ExternalLink } from 'lucide-react';
import type { NewsItem } from '@/lib/types';
import { ago } from '@/lib/format';
import { Panel } from './ui';

// Lightweight client-side signal tag so headlines are scannable at a glance.
const BULL = /(surge|rally|soar|record|high|launch|listing|adoption|upgrade|inflow|bullish|gains|breakout|partnership)/i;
const BEAR = /(hack|exploit|outage|crash|plunge|dump|lawsuit|ban|sec|bearish|liquidation|rug|decline|halt|fraud)/i;

function tag(text: string): 'bull' | 'bear' | null {
  if (BEAR.test(text)) return 'bear';
  if (BULL.test(text)) return 'bull';
  return null;
}

export function NewsFeed({ news }: { news: NewsItem[] }) {
  return (
    <Panel
      title="News Feed"
      right={<span className="text-xs text-content-muted tnum">{news.length}</span>}
      bodyClassName="max-h-[560px] overflow-y-auto scroll-thin p-0"
    >
      {news.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-content">Waiting for headlines…</p>
          <p className="mt-1 text-xs text-content-muted">Live RSS ingestion starts on the next tick.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {news.map((n) => {
            const t = tag(`${n.title} ${n.summary}`);
            return (
              <li key={n.id} className="group px-4 py-3">
                <a
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple rounded"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        t === 'bull' ? 'bg-bull' : t === 'bear' ? 'bg-bear' : 'bg-content-muted/50'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-content transition-colors duration-100 group-hover:text-white">
                        {n.title}
                        <ExternalLink
                          size={11}
                          className="ml-1 inline opacity-0 transition-opacity group-hover:opacity-60"
                        />
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-content-muted tnum">
                        <span className="truncate">{n.source}</span>
                        <span>·</span>
                        <span>{ago(n.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
