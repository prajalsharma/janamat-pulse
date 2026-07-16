'use client';

import { useCountUp } from '@/lib/useCountUp';

/**
 * Public sentiment meter, -100 (disputes) … +100 (corroborates the official
 * claim). The government's claim sits at the +100 anchor; the shaded band from
 * the live marker back to that anchor IS the accountability gap, made visible.
 *
 * Color conveys stance and is always paired with a text label (color-not-only).
 * The marker glides between readings (CSS transition) and the numeric readout
 * counts up; both collapse to static under reduced motion.
 */
export function SentimentMeter({
  value,
  flagged,
}: {
  value: number; // -100..100
  flagged: boolean;
}) {
  const clamped = Math.max(-100, Math.min(100, value));
  const pct = ((clamped + 100) / 200) * 100; // 0..100 left→right
  const animated = useCountUp(clamped);
  const color = clamped <= -20 ? '#E23252' : clamped >= 20 ? '#22D3EE' : '#94A3B8';
  const stance = clamped <= -20 ? 'Disputes' : clamped >= 20 ? 'Corroborates' : 'Neutral';

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] text-content-faint">
          Public sentiment
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="tnum font-mono text-[15px] font-semibold leading-none" style={{ color }}>
            {animated > 0 ? '+' : ''}
            {Math.round(animated)}
          </span>
          <span className="text-[10px] font-medium" style={{ color }}>
            {stance}
          </span>
        </span>
      </div>

      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full border border-line bg-ink">
        {/* dispute … corroborate track */}
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: 'linear-gradient(90deg, #E23252 0%, #94A3B8 50%, #22D3EE 100%)' }}
        />
        {/* accountability gap: shaded band from the marker back to the +100 claim anchor */}
        <div
          className={`absolute inset-y-0 right-0 rounded-r-full transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            flagged ? 'animate-meter-glow' : ''
          }`}
          style={{
            left: `${pct}%`,
            background: flagged
              ? 'linear-gradient(90deg, rgba(226,50,82,0.45), rgba(226,50,82,0.18))'
              : 'linear-gradient(90deg, rgba(148,163,184,0.28), rgba(148,163,184,0.10))',
          }}
          aria-hidden
        />
        {/* live marker */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink shadow-[0_0_0_2px_rgba(11,18,32,0.9)] transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: `${pct}%`, background: color }}
          aria-hidden
        />
        {/* +100 claim anchor */}
        <div className="absolute inset-y-0 right-0 w-[2px] bg-chain/80" aria-hidden />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] tracking-wide text-content-faint">
        <span>Disputes</span>
        <span className="inline-flex items-center gap-1 text-chain/90">
          <span className="h-1.5 w-1.5 rounded-full bg-chain" aria-hidden />
          Official claim
        </span>
      </div>
    </div>
  );
}
