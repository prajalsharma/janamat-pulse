'use client';

import { useEffect, useRef, useState } from 'react';
import { Newspaper, BrainCircuit, ShieldCheck, Repeat } from 'lucide-react';

/**
 * Hero visual: an illustrative walk through the real 4-stage pipeline
 * (news -> sentiment -> risk -> route). The active stage advances on a timer
 * to convey flow. Numbers here are SAMPLE data, labeled as such - nothing on
 * this page is a live figure.
 *
 *  t=0.0s   stage 0 (news)        active
 *  t=1.6s   stage 1 (sentiment)   active
 *  t=3.2s   stage 2 (risk)        active
 *  t=4.8s   stage 3 (route)       active
 *  loop
 */
const STAGES = [
  {
    icon: Newspaper,
    label: 'Ingest',
    detail: 'Live RSS + X headlines',
    sample: '"SOL ETF inflows hit record week"',
  },
  {
    icon: BrainCircuit,
    label: 'Score',
    detail: 'Claude / lexical fallback',
    sample: 'bullish · conf 0.78',
  },
  {
    icon: ShieldCheck,
    label: 'Risk-gate',
    detail: 'Confidence · move · caps',
    sample: 'BUY approved · $120 notional',
  },
  {
    icon: Repeat,
    label: 'Route',
    detail: 'Jupiter aggregator',
    sample: 'USDC → SOL · slippage 50 bps',
  },
] as const;

const STEP_MS = 1600;

export function PipelinePreview() {
  const [active, setActive] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) {
      setActive(STAGES.length - 1); // show the resolved end-state, no motion
      return;
    }
    const id = setInterval(() => setActive((a) => (a + 1) % STAGES.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-panel sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-content-muted">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full" />
            <span className="inline-flex h-2 w-2 rounded-full bg-brand-green" />
          </span>
          Agent tick
        </div>
        <span className="rounded-md border border-border bg-surface-2/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-content-muted">
          Sample · illustrative
        </span>
      </div>

      <ol className="space-y-2.5">
        {STAGES.map((s, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <li
              key={s.label}
              className={[
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300',
                isActive
                  ? 'border-brand-purple/50 bg-brand-purple/10'
                  : isDone
                    ? 'border-border bg-surface-2/50'
                    : 'border-border/60 bg-surface-2/20',
              ].join(' ')}
            >
              <span
                className={[
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors duration-300',
                  isActive ? 'bg-brand-purple/20 text-brand-purple' : 'bg-surface-2 text-content-muted',
                ].join(' ')}
              >
                <s.icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-content">{s.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-content-muted">
                    {s.detail}
                  </span>
                </div>
                <div
                  className={[
                    'truncate font-mono text-[11px] tnum transition-colors duration-300',
                    isActive ? 'text-content' : 'text-content-muted',
                  ].join(' ')}
                >
                  {s.sample}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
