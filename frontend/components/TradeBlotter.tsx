'use client';

import { ExternalLink } from 'lucide-react';
import type { TradeRow } from '@/lib/types';
import { ago, token, usd } from '@/lib/format';
import { Badge, Panel } from './ui';

const SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: 'SOL',
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
};
const sym = (mint: string) => SYMBOLS[mint] ?? `${mint.slice(0, 4)}…`;

function statusTone(s: TradeRow['status']) {
  if (s === 'confirmed') return 'bull' as const;
  if (s === 'failed') return 'bear' as const;
  if (s === 'submitted') return 'warn' as const;
  return 'purple' as const; // simulated
}

export function TradeBlotter({ trades }: { trades: TradeRow[] }) {
  return (
    <Panel
      title="Trade Blotter"
      right={<span className="text-xs text-content-muted tnum">{trades.length} fills</span>}
      bodyClassName="max-h-[420px] overflow-y-auto scroll-thin p-0"
    >
      {trades.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-content">No trades executed yet.</p>
          <p className="mt-1 text-xs text-content-muted">
            Fills appear here once a decision clears every risk gate.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface text-left text-[11px] uppercase tracking-wide text-content-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-2 font-medium">Side</th>
              <th className="px-2 py-2 font-medium">Route</th>
              <th className="px-2 py-2 text-right font-medium">In</th>
              <th className="px-2 py-2 text-right font-medium">Out</th>
              <th className="px-2 py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                className="animate-fade-up border-b border-border/60 transition-colors duration-100 hover:bg-surface-2/40"
              >
                <td className="px-4 py-2.5">
                  <span
                    className={`font-semibold ${t.action === 'buy' ? 'text-bull' : 'text-bear'}`}
                  >
                    {t.action.toUpperCase()}
                  </span>
                  <div className="text-[11px] text-content-muted tnum">{ago(t.at)}</div>
                </td>
                <td className="px-2 py-2.5 text-xs text-content-muted">{t.routeLabel}</td>
                <td className="px-2 py-2.5 text-right font-mono text-xs tnum">
                  {token(t.inAmount, 4)} <span className="text-content-muted">{sym(t.inputMint)}</span>
                </td>
                <td className="px-2 py-2.5 text-right font-mono text-xs tnum">
                  {token(t.outAmount, 4)} <span className="text-content-muted">{sym(t.outputMint)}</span>
                </td>
                <td className="px-2 py-2.5 text-right font-mono text-xs tnum">{usd(t.priceUsd)}</td>
                <td className="px-4 py-2.5 text-right">
                  {t.signature ? (
                    <a
                      href={`https://solscan.io/tx/${t.signature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-green transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                    >
                      confirmed <ExternalLink size={11} />
                    </a>
                  ) : (
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
