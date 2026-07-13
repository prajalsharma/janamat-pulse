import { ReactNode } from 'react';

export function Panel({
  title,
  right,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface shadow-panel ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-content-muted">
            {title}
          </h2>
          {right}
        </header>
      )}
      <div className={bodyClassName || 'p-4'}>{children}</div>
    </section>
  );
}

const toneMap = {
  bull: 'bg-bull/12 text-bull ring-bull/25',
  bear: 'bg-bear/12 text-bear ring-bear/25',
  warn: 'bg-warn/12 text-warn ring-warn/25',
  purple: 'bg-brand-purple/15 text-brand-purple ring-brand-purple/30',
  muted: 'bg-surface-2 text-content-muted ring-border',
} as const;

export function Badge({
  tone = 'muted',
  children,
  className = '',
}: {
  tone?: keyof typeof toneMap;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ${toneMap[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'bull' | 'bear';
}) {
  const valueTone =
    tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : 'text-content';
  return (
    <div className="rounded-lg border border-border bg-surface-2/60 px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-wide text-content-muted">{label}</div>
      <div className={`mt-1 font-mono text-xl tnum ${valueTone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-content-muted tnum">{sub}</div>}
    </div>
  );
}

export function Dot({ tone }: { tone: 'live' | 'idle' | 'off' }) {
  const c =
    tone === 'live' ? 'bg-bull' : tone === 'idle' ? 'bg-warn' : 'bg-content-muted';
  return (
    <span className="relative inline-flex h-2 w-2">
      {tone === 'live' && (
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full" />
      )}
      <span className={`inline-flex h-2 w-2 rounded-full ${c}`} />
    </span>
  );
}
