import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from './Reveal';

export function FinalCta() {
  return (
    <section className="border-t border-border/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[1160px] px-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-panel sm:px-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[640px] -translate-x-1/2 rounded-full bg-beam-soft blur-3xl"
            />
            <div className="relative mx-auto max-w-xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-content sm:text-[2.4rem] sm:leading-[1.1]">
                See the agent trade the news
              </h2>
              <p className="mt-4 text-pretty text-[15px] leading-relaxed text-content-muted">
                The terminal auto-starts in dry-run. Watch it free, or sign in to
                start, pause, and fund the agent yourself.
              </p>
              <Link
                href="/app"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-beam px-6 text-base font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px"
              >
                Launch Terminal
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </Link>
              <p className="mt-6 text-[12.5px] text-content-muted">
                Demo instrument. Runs in dry-run by default. No funds move. LLM-driven
                trading is inherently noisy. Not financial advice.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
