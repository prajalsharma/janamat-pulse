'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, RefreshCw, ShieldAlert, Radio } from 'lucide-react';
import { Wordmark } from './Logo';
import { ProjectCard } from './ProjectCard';
import { CastVoiceModal } from './CastVoiceModal';
import { AuthButton } from '@/components/auth/AuthButton';
import { useCountUp } from '@/lib/useCountUp';
import { relTime } from '@/lib/format';
import { useCivicPulse, flagFor, headlinesFor, type CivicProjectView } from '@/lib/civic';

export function CivicTerminal() {
  const { projects, snapshot, loading, error, refreshing, refresh } = useCivicPulse();
  const [active, setActive] = useState<CivicProjectView | null>(null);

  const flaggedCount = snapshot?.flags.filter((f) => f.flagged).length ?? 0;
  const scored = snapshot?.items.length ?? 0;
  const engine = snapshot?.engine ?? 'idle';
  const lastAt = snapshot?.at ?? null;
  const live = !error;

  return (
    <div className="min-h-dvh">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link
            href="/"
            aria-label="Back to home"
            className="rounded transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 cursor-pointer"
          >
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <LivePill live={live} lastAt={lastAt} />
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-content-muted transition-colors hover:border-signal/40 hover:text-content disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} aria-hidden />
              Refresh
            </button>
            <AuthButton compact />
          </div>
        </div>
        {/* live scan line: a quiet signature that the instrument is running */}
        <div aria-hidden className="relative h-px w-full overflow-hidden">
          {live && (
            <div className="absolute inset-y-0 left-0 h-px w-1/3 animate-scan-x bg-gradient-to-r from-transparent via-signal/70 to-transparent" />
          )}
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
              An AI agent reads Nepal&apos;s civic discourse, measures public sentiment against each
              government&apos;s official claim, and anchors a tamper-proof record on Solana. One
              verified human, one voice.
            </p>
          </div>
          <StatStrip
            tracked={projects.length}
            scored={scored}
            flagged={flaggedCount}
            engine={engine}
          />
        </div>

        {/* project grid */}
        <section className="mt-8" aria-label="Tracked government projects">
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  flag={flagFor(snapshot, p.id)}
                  headlines={headlinesFor(snapshot, p.id)}
                  index={i}
                  onCastVoice={setActive}
                />
              ))}
            </div>
          )}
          {!loading && projects.length === 0 && <EmptyState error={error} onRetry={refresh} />}
        </section>

        <footer className="mt-12 border-t border-line pt-5 text-[12px] text-content-faint">
          A civic-transparency prototype. Solana is used as a public ledger, not money. No token,
          no trading. Complements{' '}
          <a
            href="https://janamat.app/"
            target="_blank"
            rel="noreferrer"
            className="text-content-muted transition-colors hover:text-signal cursor-pointer"
          >
            Janamat
          </a>
          .
        </footer>
      </main>

      {active && <CastVoiceModal project={active} onClose={() => setActive(null)} />}
    </div>
  );
}

/** Live status + last-sync time. The dot pulses only while the feed is live. */
function LivePill({ live, lastAt }: { live: boolean; lastAt: number | null }) {
  const synced = lastAt ? relTime(lastAt) : null;
  return (
    <span className="hidden items-center gap-2 rounded-full border border-line bg-surface/60 px-2.5 py-1 text-[11.5px] text-content-muted sm:inline-flex">
      <span className="relative flex h-2 w-2">
        {live && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-signal/60 animate-pulse-dot" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-signal' : 'bg-content-faint'}`}
        />
      </span>
      <span className="font-medium text-content">{live ? 'Live' : 'Offline'}</span>
      {live && synced && (
        <span className="tnum font-mono text-[10.5px] text-content-faint">· {synced}</span>
      )}
    </span>
  );
}

function StatStrip({
  tracked,
  scored,
  flagged,
  engine,
}: {
  tracked: number;
  scored: number;
  flagged: number;
  engine: string;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4 md:w-auto">
      <Stat label="Projects" value={tracked} icon={<Activity size={14} className="text-signal" />} />
      <Stat
        label="Signals"
        value={scored}
        icon={<Radio size={14} className="text-signal" />}
      />
      <Stat
        label="Gaps flagged"
        value={flagged}
        icon={
          <ShieldAlert
            size={14}
            className={flagged > 0 ? 'text-civic' : 'text-content-faint'}
          />
        }
        emphasize={flagged > 0}
      />
      <Stat label="Engine" text={engine} />
    </div>
  );
}

function Stat({
  label,
  value,
  text,
  icon,
  emphasize,
}: {
  label: string;
  value?: number;
  text?: string;
  icon?: React.ReactNode;
  emphasize?: boolean;
}) {
  const animated = useCountUp(value ?? 0);
  return (
    <div className="min-w-[5.5rem] bg-surface px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span
          className={`tnum text-lg font-semibold ${emphasize ? 'text-civic' : 'text-content'}`}
        >
          {text ?? Math.round(animated)}
        </span>
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-content-faint">
        {label}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="relative h-[26rem] overflow-hidden rounded-xl border border-line bg-surface"
        >
          <div className="absolute inset-0 animate-sweep bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 rounded bg-white/[0.05]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            <div className="mt-6 h-16 w-full rounded-lg bg-white/[0.04]" />
            <div className="h-2.5 w-full rounded-full bg-white/[0.05]" />
            <div className="mt-6 h-10 w-full rounded bg-white/[0.03]" />
          </div>
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
        className="mt-3 rounded-md border border-line px-3 py-1.5 text-[13px] text-content transition-colors hover:bg-white/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
      >
        Retry
      </button>
    </div>
  );
}
