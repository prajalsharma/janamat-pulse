'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PriceSnapshot } from '@/lib/types';
import { usd } from '@/lib/format';
import { Panel } from './ui';

export function PricePanel({
  price,
  history,
}: {
  price: PriceSnapshot | null;
  history: PriceSnapshot[];
}) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (price == null) return;
    if (prev.current != null && price.priceUsd !== prev.current) {
      setFlash(price.priceUsd > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 320);
      prev.current = price.priceUsd;
      return () => clearTimeout(t);
    }
    prev.current = price.priceUsd;
  }, [price]);

  const pts = history.slice(-40).map((p) => p.priceUsd);
  const first = pts[0] ?? price?.priceUsd ?? 0;
  const last = price?.priceUsd ?? first;
  const changePct = first ? ((last - first) / first) * 100 : 0;
  const up = changePct >= 0;

  const flashColor = flash === 'up' ? '#14F195' : flash === 'down' ? '#FF5C7A' : undefined;

  return (
    <Panel
      title="SOL / USDC"
      right={
        <span
          className={`inline-flex items-center gap-1 font-mono text-xs tnum ${up ? 'text-bull' : 'text-bear'}`}
        >
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {up ? '+' : ''}
          {changePct.toFixed(2)}%
        </span>
      }
    >
      <div
        className="font-mono text-3xl tnum transition-colors duration-300"
        style={{ color: flashColor ?? '#ECECF3' }}
      >
        {usd(price?.priceUsd, 2)}
      </div>
      <Sparkline points={pts} up={up} />
      <div className="mt-1 flex items-center gap-2 text-xs text-content-muted">
        {price?.source === 'sentiment' && (
          <span className="rounded bg-brand-purple/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-purple ring-1 ring-inset ring-brand-purple/25">
            news-driven
          </span>
        )}
        <span>{history.length > 1 ? `${history.length} samples` : 'warming up'}</span>
      </div>
    </Panel>
  );
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) {
    return <div className="mt-3 h-16 rounded-md bg-surface-2/50" />;
  }
  const w = 100;
  const h = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(2)} ${(h - ((p - min) / span) * h).toFixed(2)}`)
    .join(' ');
  const stroke = up ? '#14F195' : '#FF5C7A';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-3 h-16 w-full">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#spark)" />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
