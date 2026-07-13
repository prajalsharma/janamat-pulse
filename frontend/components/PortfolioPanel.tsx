'use client';

import type { Portfolio } from '@/lib/types';
import { signedUsd, token, usd, pct } from '@/lib/format';
import { Panel, StatTile } from './ui';

export function PortfolioPanel({ p }: { p: Portfolio | null }) {
  const total = p?.totalPnlUsd ?? 0;
  const tone = total > 0 ? 'bull' : total < 0 ? 'bear' : 'default';

  return (
    <Panel title="Agent Book · P&L">
      {!p ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-lg bg-surface-2/50" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Total P&L"
              value={signedUsd(p.totalPnlUsd)}
              sub={`realized ${signedUsd(p.realizedPnlUsd)}`}
              tone={tone}
            />
            <StatTile
              label="Unrealized"
              value={signedUsd(p.unrealizedPnlUsd)}
              sub={`mark ${usd(p.markPriceUsd)}`}
              tone={p.unrealizedPnlUsd >= 0 ? 'bull' : 'bear'}
            />
            <StatTile
              label={`${p.baseSymbol} held`}
              value={token(p.baseAmount, 4)}
              sub={p.avgEntryUsd ? `avg ${usd(p.avgEntryUsd)}` : 'flat'}
            />
            <StatTile
              label="Win rate"
              value={pct(p.winRate, 0)}
              sub={`${p.tradeCount} trades`}
            />
          </div>
          {p.onchainSol != null && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-surface-2/40 px-3.5 py-2 text-xs">
              <span className="text-content-muted">Agent Vault balance</span>
              <span className="font-mono tnum text-content">{token(p.onchainSol, 4)} SOL</span>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
