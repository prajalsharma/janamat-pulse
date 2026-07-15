import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Reveal } from './Reveal';

const EXPLORER =
  'https://explorer.solana.com/address/GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu?cluster=devnet';

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-4 md:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface/40 p-1.5 shadow-panel">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-10%,rgba(34,211,238,0.12),transparent_70%)]"
          />
          <div className="relative rounded-[calc(1.75rem-0.375rem)] border border-line/60 bg-ink/60 px-6 py-14 text-center md:px-10 md:py-20">
            <h2 className="mx-auto max-w-3xl text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-content sm:text-[2.6rem]">
              See the gap between claim and reality, in real time.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-content-muted">
              Open the live civic terminal: sentiment by project, accountability flags, and the
              on-chain record behind every verified voice.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/app"
                className="group inline-flex items-center gap-2.5 rounded-full bg-signal py-2.5 pl-6 pr-2.5 text-[14px] font-semibold text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-signal-glow active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Open the pulse
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/15 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </span>
              </Link>
              <a
                href={EXPLORER}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[14px] font-medium text-content-muted transition-colors duration-300 hover:border-chain/50 hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-chain/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <ExternalLink size={15} strokeWidth={1.75} className="text-chain" aria-hidden />
                View the program
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
