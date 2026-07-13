import { Newspaper, BrainCircuit, ShieldCheck, Repeat } from 'lucide-react';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    icon: Newspaper,
    n: '01',
    title: 'Ingest news',
    body: 'Every tick (45s by default) the agent pulls fresh crypto headlines from live RSS feeds. Real sources, not a cached demo dataset.',
    tech: 'Live RSS + X feeds → SQLite',
  },
  {
    icon: BrainCircuit,
    n: '02',
    title: 'Score sentiment',
    body: 'Claude reads the headlines and scores their short-term impact on SOL with a direction and confidence. A deterministic lexical scorer takes over if no API key is set, so the loop never stalls.',
    tech: 'Claude · deterministic fallback',
  },
  {
    icon: ShieldCheck,
    n: '03',
    title: 'Risk-gate',
    body: 'The LLM proposes; the risk engine disposes. Direction maps from sentiment, then confidence, price-movement, cooldown, position-size and slippage gates decide whether anything trades at all.',
    tech: 'Confidence · move · cooldown · caps',
  },
  {
    icon: Repeat,
    n: '04',
    title: 'Route via Jupiter',
    body: 'Approved trades are sized by confidence and routed through Jupiter, Solana’s DEX aggregator, for the best path across venues. In dry-run the quote is real and the fill is simulated.',
    tech: 'Jupiter aggregator · Orca / Raydium',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[1160px] px-5">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="One loop, four honest stages"
            lead="No black boxes. The full reasoning chain for every decision is persisted and streamed to the terminal as it happens."
          />
        </Reveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-border bg-surface p-5 shadow-panel transition-colors duration-200 hover:border-brand-purple/40">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-brand-purple ring-1 ring-inset ring-border transition-colors duration-200 group-hover:bg-brand-purple/15">
                    <s.icon size={18} />
                  </span>
                  <span className="font-mono text-xs tnum text-content-muted/70">{s.n}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-content">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-content-muted">{s.body}</p>
                <div className="mt-4 border-t border-border pt-3 font-mono text-[11px] tnum text-content-muted/80">
                  {s.tech}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
