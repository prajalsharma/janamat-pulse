import Link from 'next/link';
import { ArrowUpRight, ArrowDown, ShieldCheck, Eye, FlaskConical } from 'lucide-react';
import { PipelinePreview } from './PipelinePreview';

/**
 * Hero entrance - staggered fade-up on mount via the `animate-fade-up`
 * keyframe (framer-motion is not a dependency). Absolute timings from mount,
 * each ≤ 320ms start, 300ms duration, resolved by the shared reduced-motion
 * rule in globals.css.
 *
 *   0ms   eyebrow
 *  80ms   headline
 * 160ms   sub-line
 * 240ms   CTAs
 * 320ms   honesty chips
 * 200ms   pipeline preview (right column)
 */
const HONESTY = [
  { icon: FlaskConical, text: 'Dry-run by default' },
  { icon: Eye, text: 'Open reasoning on every trade' },
  { icon: ShieldCheck, text: 'No fabricated metrics' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* single hero accent: a soft beam wash, per brand (never full-panel gradient) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-beam-soft blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1160px] items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
        {/* Left: copy */}
        <div>
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-content-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-beam" />
            Autonomous · news-sentiment · Solana
          </span>

          <h1
            className="mt-5 animate-fade-up text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-content sm:text-5xl lg:text-[3.4rem]"
            style={{ animationDelay: '80ms' }}
          >
            An AI agent that reads the news and trades Solana,{' '}
            <span className="bg-beam bg-clip-text text-transparent">out loud</span>.
          </h1>

          <p
            className="mt-5 max-w-xl animate-fade-up text-pretty text-base leading-relaxed text-content-muted sm:text-[17px]"
            style={{ animationDelay: '160ms' }}
          >
            SolVane ingests live crypto headlines, scores their short-term impact on
            SOL with Claude, and gates every idea through a deterministic risk engine
            before routing swaps through Jupiter. It runs live in{' '}
            <span className="text-content">dry-run</span> by default. Real news, real
            prices, real quotes, simulated fills.
          </p>

          <div
            className="mt-8 flex animate-fade-up flex-wrap items-center gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              href="/app"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-beam px-5 text-[15px] font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink active:translate-y-px"
            >
              Launch Terminal
              <ArrowUpRight size={17} strokeWidth={2.5} />
            </Link>
            <a
              href="#how"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-5 text-[15px] font-medium text-content transition-colors duration-150 hover:border-brand-purple/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              How it works
              <ArrowDown size={16} />
            </a>
          </div>

          <ul
            className="mt-8 flex animate-fade-up flex-wrap gap-x-5 gap-y-2"
            style={{ animationDelay: '320ms' }}
          >
            {HONESTY.map((h) => (
              <li key={h.text} className="flex items-center gap-1.5 text-[13px] text-content-muted">
                <h.icon size={14} className="text-brand-green" />
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: illustrative pipeline */}
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <PipelinePreview />
        </div>
      </div>
    </section>
  );
}
