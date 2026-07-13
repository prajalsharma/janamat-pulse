/** Janamat Pulse mark — the civic-signal pulse (teal → violet, crimson origin). */
export function LogoMark({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Janamat Pulse"
    >
      <rect x="0" y="0" width="200" height="200" rx="40" fill="#0B1220" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#F5F7FA" strokeOpacity="0.12" strokeWidth="2" />
      <circle cx="40" cy="110" r="6" fill="#E23252" />
      <path d="M40,110 L62,110 L72,94 L82,110 L96,110" fill="none" stroke="#22D3EE" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M96,110 L112,132 L156,64" fill="none" stroke="#9945FF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="156" cy="64" r="5" fill="#22D3EE" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} />
      <span className="text-[17px] font-semibold tracking-tight text-content">
        Janamat<span className="font-light text-signal"> Pulse</span>
      </span>
    </div>
  );
}
