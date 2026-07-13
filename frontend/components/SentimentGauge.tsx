'use client';

import type { SentimentResult } from '@/lib/types';
import { pct } from '@/lib/format';
import { Badge, Panel } from './ui';

/**
 * Semicircular gauge: needle position encodes score (-1 bearish … +1 bullish),
 * arc fill length encodes |score|, color encodes direction. Confidence is the
 * secondary readout. This is the agent's "conviction" at a glance.
 */
export function SentimentGauge({ sentiment }: { sentiment: SentimentResult | null }) {
  const score = sentiment?.score ?? 0;
  const dir = sentiment?.sentiment ?? 'neutral';
  const tone = dir === 'bullish' ? 'bull' : dir === 'bearish' ? 'bear' : 'muted';
  const color = dir === 'bullish' ? '#14F195' : dir === 'bearish' ? '#FF5C7A' : '#8A8A9A';

  // Map score [-1,1] to angle [180°(left) … 0°(right)] across the top semicircle.
  const angle = 180 - ((score + 1) / 2) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 120;
  const cy = 120;
  const r = 92;
  const nx = cx + r * Math.cos(rad);
  const ny = cy - r * Math.sin(rad);

  // Arc from neutral-top to needle to visualize magnitude.
  const startAngle = 90; // top center
  const describeArc = (a0: number, a1: number) => {
    const p0 = polar(cx, cy, r, a0);
    const p1 = polar(cx, cy, r, a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`;
  };

  return (
    <Panel
      title="Market Sentiment"
      right={
        sentiment && (
          <Badge tone={sentiment.engine === 'claude' ? 'purple' : 'muted'}>
            {sentiment.engine === 'claude' ? 'Claude' : 'lexical'}
          </Badge>
        )
      }
    >
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 240 140" className="w-full max-w-[280px]">
          {/* Track */}
          <path
            d={describeArc(180, 0)}
            fill="none"
            stroke="#242433"
            strokeWidth={12}
            strokeLinecap="round"
          />
          {/* Magnitude arc from center-top to needle */}
          <path
            d={describeArc(startAngle, angle)}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            style={{ transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)' }}
          />
          <circle cx={cx} cy={cy} r={5} fill={color} />
          {/* End labels */}
          <text x="14" y="134" fill="#8A8A9A" fontSize="10" className="uppercase">
            Bear
          </text>
          <text x="205" y="134" fill="#8A8A9A" fontSize="10" className="uppercase">
            Bull
          </text>
        </svg>

        <div className="-mt-2 flex flex-col items-center gap-1">
          <Badge tone={tone as 'bull' | 'bear' | 'muted'} className="text-[13px]">
            {dir}
          </Badge>
          <div className="font-mono text-3xl tnum" style={{ color }}>
            {score > 0 ? '+' : ''}
            {score.toFixed(2)}
          </div>
          <div className="text-xs text-content-muted tnum">
            confidence {pct(sentiment?.confidence ?? 0, 0)}
          </div>
        </div>

        <p className="mt-4 min-h-[2.5rem] text-center text-sm leading-relaxed text-content-muted">
          {sentiment?.rationale ?? 'Awaiting first analysis…'}
        </p>
      </div>
    </Panel>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}
