'use client';

import { ArrowUpRight, ArrowDownRight, Minus, ShieldCheck, ShieldX } from 'lucide-react';
import type { DecisionRow } from '@/lib/types';
import { ago, usd, pct } from '@/lib/format';
import { Badge, Panel } from './ui';

function ActionIcon({ action }: { action: DecisionRow['action'] }) {
  if (action === 'buy') return <ArrowUpRight size={15} className="text-bull" />;
  if (action === 'sell') return <ArrowDownRight size={15} className="text-bear" />;
  return <Minus size={15} className="text-content-muted" />;
}

export function DecisionFeed({ decisions }: { decisions: DecisionRow[] }) {
  return (
    <Panel
      title="Decision Log"
      right={<span className="text-xs text-content-muted tnum">{decisions.length}</span>}
      bodyClassName="max-h-[420px] overflow-y-auto scroll-thin p-0"
    >
      {decisions.length === 0 ? (
        <Empty />
      ) : (
        <ul className="divide-y divide-border">
          {decisions.map((d) => (
            <li key={d.id} className="animate-fade-up px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ActionIcon action={d.action} />
                  <span className="text-sm font-semibold capitalize text-content">
                    {d.action}
                  </span>
                  {d.approved ? (
                    <Badge tone="bull">
                      <ShieldCheck size={11} /> executed
                    </Badge>
                  ) : (
                    <Badge tone="muted">
                      <ShieldX size={11} /> held
                    </Badge>
                  )}
                </div>
                <span className="whitespace-nowrap text-xs text-content-muted tnum">
                  {ago(d.at)}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted tnum">
                <span>
                  score{' '}
                  <span className={(d.score ?? 0) >= 0 ? 'text-bull' : 'text-bear'}>
                    {(d.score ?? 0) > 0 ? '+' : ''}
                    {(d.score ?? 0).toFixed(2)}
                  </span>
                </span>
                <span>conf {pct(d.confidence, 0)}</span>
                {d.priceUsd != null && <span>@ {usd(d.priceUsd)}</span>}
                {d.approved && <span>sized {usd(d.notionalUsd)}</span>}
              </div>

              {/* Reasoning chain - why the risk engine did what it did */}
              <ul className="mt-2 space-y-1">
                {d.reasons.map((r, i) => (
                  <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-content-muted">
                    <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-brand-purple/70" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Empty() {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-content">No decisions yet.</p>
      <p className="mt-1 text-xs text-content-muted">
        The agent evaluates every tick. Press <span className="text-content">Tick</span> to force one now.
      </p>
    </div>
  );
}
