import Link from 'next/link';
import { ArrowUpRight, Gauge, ListChecks, Receipt, TrendingUp } from 'lucide-react';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const FEATURES = [
  {
    icon: Gauge,
    title: 'Sentiment gauge',
    body: 'The current read on SOL: direction, score, and confidence, updated each tick.',
  },
  {
    icon: ListChecks,
    title: 'Decision log',
    body: 'Every evaluation with its rationale and the gate reasons behind approve or hold.',
  },
  {
    icon: Receipt,
    title: 'Trade blotter',
    body: 'Fills with their Jupiter route, slippage, notional and dry-run / live status.',
  },
  {
    icon: TrendingUp,
    title: 'Live P&L',
    body: 'A reconstructed book: position, average entry, realized and unrealized P&L.',
  },
];

export function TerminalPreview() {
  return (
    <section id="terminal" className="scroll-mt-20 border-t border-border/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[1160px] px-5">
        <Reveal>
          <SectionHeading
            eyebrow="The terminal"
            title="Watch it think in real time"
            lead="A dark trading terminal that streams the agent's state over WebSocket. This is a representative preview. The live view is one click away."
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Feature list */}
          <Reveal>
            <ul className="space-y-5">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand-green ring-1 ring-inset ring-border">
                    <f.icon size={17} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-content">{f.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-content-muted">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="mt-7 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-4 text-sm font-medium text-content transition-colors duration-150 hover:border-brand-purple/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              Open the live terminal
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </Link>
          </Reveal>

          {/* Representative mock */}
          <Reveal delay={90}>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
              {/* window chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-ink/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-bear/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warn/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-green/60" />
                <span className="ml-2 font-mono text-[11px] tnum text-content-muted">solvane · /app</span>
                <span className="ml-auto rounded border border-border bg-surface-2/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-content-muted">
                  Representative · sample data
                </span>
              </div>

              <div className="space-y-3 p-4">
                {/* sentiment gauge */}
                <div className="rounded-xl border border-border bg-surface-2/50 p-3.5">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-content-muted">
                    <span>Sentiment · SOL</span>
                    <span className="text-brand-green">bullish</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink">
                    <div className="h-full w-[72%] rounded-full bg-beam" />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[11px] tnum text-content-muted">
                    <span>score +0.72</span>
                    <span>conf 0.78</span>
                  </div>
                </div>

                {/* decision row */}
                <div className="rounded-xl border border-border bg-surface-2/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-brand-green/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-green ring-1 ring-inset ring-brand-green/25">
                      BUY approved
                    </span>
                    <span className="font-mono text-[11px] tnum text-content-muted">$120.00</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-snug text-content-muted">
                    ETF inflow headlines lift near-term SOL demand; confidence and price-move gates cleared.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {['conf ✓', 'move ✓', 'cooldown ✓', 'cap ✓'].map((r) => (
                      <span
                        key={r}
                        className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] tnum text-content-muted"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* blotter + pnl */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-surface-2/50 p-3.5">
                    <div className="text-[11px] uppercase tracking-wide text-content-muted">Last fill</div>
                    <div className="mt-1 font-mono text-[13px] tnum text-content">USDC → SOL</div>
                    <div className="mt-1 font-mono text-[10.5px] tnum text-content-muted">
                      Jupiter · 50 bps · simulated
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/50 p-3.5">
                    <div className="text-[11px] uppercase tracking-wide text-content-muted">Unrealized P&amp;L</div>
                    <div className="mt-1 font-mono text-lg tnum text-brand-green">+$18.40</div>
                    <div className="mt-0.5 font-mono text-[10.5px] tnum text-content-muted">win rate 61%</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
