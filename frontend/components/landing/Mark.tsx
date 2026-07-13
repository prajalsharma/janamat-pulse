/**
 * Dark-surface SolVane wordmark. The shipped logo SVG uses ink-colored text
 * meant for light backgrounds, so on the dark landing we render our own mark:
 * a beam-gradient badge with the news-flag glyph + a legible wordmark.
 */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="grid h-8 w-8 place-items-center rounded-lg bg-beam shadow-[0_0_0_1px_rgba(153,69,255,0.35),0_6px_20px_-8px_rgba(20,241,149,0.5)]"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
          <polygon points="16,88 8,80 82,10" fill="#0B0B14" />
          <path d="M 42 62 Q 12 48, 24 34 Q 44 44, 56 47 Z" fill="#0B0B14" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-content">
        Sol<span className="text-brand-green">Vane</span>
      </span>
    </span>
  );
}
