/**
 * Public sentiment meter, -100 (disputes) … +100 (corroborates the official
 * claim). The government's claim sits at the +100 anchor; the marker's distance
 * from it is the accountability gap. Color conveys stance AND is paired with a
 * text label (color-not-only rule).
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
  const color = clamped <= -20 ? '#E23252' : clamped >= 20 ? '#22D3EE' : '#94A3B8';

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-ink border border-line overflow-hidden">
        {/* dispute … corroborate track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #E23252 0%, #94A3B8 50%, #22D3EE 100%)',
          }}
        />
        {/* marker */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink"
          style={{ left: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-content-faint tracking-wide">
        <span>Disputes</span>
        <span
          className="tnum font-mono font-medium"
          style={{ color }}
        >
          {clamped > 0 ? '+' : ''}
          {clamped.toFixed(0)}
        </span>
        <span>Corroborates</span>
      </div>
    </div>
  );
}
