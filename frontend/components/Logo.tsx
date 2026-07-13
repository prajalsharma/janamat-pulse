/**
 * SolVane logo lockup - header-optimized.
 *
 * Redrawn tight from `solvane-logo-v3.svg`: the gradient "beam" mark (breaking-news
 * flag on a rising pole) inside a dark badge, paired with a crisp text wordmark so it
 * stays legible at ~36-40px instead of the original 680×230 art with a tiny embedded
 * SVG wordmark. Colors come from the brand beam gradient (purple → green).
 */

export function LogoMark({
  size = 38,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    // viewBox reuses the source badge coordinates (badge = 40,40 → 200,200) so the
    // beam geometry is the authored one, just tightly cropped.
    <svg
      viewBox="40 40 160 160"
      width={size}
      height={size}
      role="img"
      aria-label="SolVane"
      className={className}
    >
      <defs>
        <linearGradient
          id="solvane-beam"
          x1="55"
          y1="185"
          x2="165"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect x="41" y="41" width="158" height="158" rx="34" fill="#0B0B14" />
      <rect
        x="41"
        y="41"
        width="158"
        height="158"
        rx="34"
        fill="none"
        stroke="url(#solvane-beam)"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      {/* Rising pole */}
      <polygon points="71.41,182.44 60.59,173.56 158,66" fill="url(#solvane-beam)" />
      {/* News flag */}
      <path
        d="M 95.35 142.21 Q 58 124, 72.6 106.88 Q 96 118, 111.65 122.35 Z"
        fill="url(#solvane-beam)"
      />
    </svg>
  );
}

export function Logo({
  size = 38,
  showWordmark = true,
  className = '',
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="text-[19px] font-bold leading-none tracking-tight">
          <span className="text-content">Sol</span>
          <span className="bg-beam bg-clip-text text-transparent">Vane</span>
        </span>
      )}
    </span>
  );
}
