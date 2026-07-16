'use client';

import { useState } from 'react';
import { Activity, RefreshCw, ShieldAlert } from 'lucide-react';
import { Wordmark } from './Logo';
import { ProjectCard } from './ProjectCard';
import { CastVoiceModal } from './CastVoiceModal';
import { AuthButton } from '@/components/auth/AuthButton';
import { useCivicPulse, flagFor, type CivicProjectView } from '@/lib/civic';

export function CivicTerminal() {
  const { projects, snapshot, loading, error, refreshing, refresh } = useCivicPulse();
  const [active, setActive] = useState<CivicProjectView | null>(null);

  const flaggedCount = snapshot?.flags.filter((f) => f.flagged).length ?? 0;
  const engine = snapshot?.engine ?? '—';
  const live = !error;

  return (
    <div className="min-h-dvh">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Wordmark />
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[12px] text-content-muted sm:inline-flex">
              <span
                className={`h-2 w-2 rounded-full ${live ? 'bg-signal animate-pulse-dot' : 'bg-content-faint'}`}
                aria-hidden
              />
              {live ? 'Live' : 'Offline'}
            </span>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-content-muted transition-colors hover:text-content hover:border-signal/40 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} aria-hidden />
              Refresh
            </button>
            <AuthButton compact />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* intro + live stats */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold leading-tight text-content sm:text-[28px]">
              The public pulse on government projects, on-chain.
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
              An AI agent reads Nepal's civic discourse, measures public sentiment against each
              government's official claim, and anchors a tamper-proof record on Solana. One
              verified human, one voice.
            </p>
          </div>
          <StatStrip
            tracked={projects.length}
            flagged={flaggedCount}
            engine={engine}
            scored={snapshot?.items.length ?? 0}
          />
        </div>

        {/* project grid */}
        <section className="mt-8" aria-label="Tracked government projects">
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  flag={flagFor(snapshot, p.id)}
                  onCastVoice={setActive}
                />
              ))}
            </div>
          )}
          {!loading && projects.length === 0 && (
            <EmptyState error={error} onRetry={refresh} />
          )}
        </section>

        <footer className="mt-12 border-t border-line pt-5 text-[12px] text-content-faint">
          A civic-transparency prototype. Solana is used as a public ledger, not money. No token,
          no trading. Complements{' '}
          <a href="https://janamat.app/" target="_blank" rel="noreferrer" className="text-content-muted hover:text-signal cursor-pointer">
            Janamat
          </a>
          .
        </footer>
      </main>

      {active && <CastVoiceModal project={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function StatStrip({
  tracked,
  flagged,
  engine,
  scored,
}: {
  tracked: number;
  flagged: number;
  engine: string;
  scored: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
      <Stat label="Projects" value={String(tracked)} icon={<Activity size={14} className="text-signal" />} />
      <Stat
        label="Gaps flagged"
        value={String(flagged)}
        icon={<ShieldAlert size={14} className={flagged > 0 ? 'text-civic' : 'text-content-faint'} />}
        emphasize={flagged > 0}
      />
      <Stat label="Engine" value={engine} />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  emphasize,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className={`tnum text-lg font-semibold ${emphasize ? 'text-civic' : 'text-content'}`}>{value}</span>
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-content-faint">{label}</div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative h-64 overflow-hidden rounded-xl border border-line bg-surface">
          <div className="absolute inset-0 animate-sweep bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-8 text-center">
      <p className="text-[14px] text-content-muted">
        {error ? 'Could not reach the civic agent.' : 'No projects registered yet.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md border border-line px-3 py-1.5 text-[13px] text-content hover:bg-white/5 cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}
