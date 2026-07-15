import { Newspaper, Scale, ShieldAlert, Fingerprint } from 'lucide-react';
import { Reveal } from './Reveal';

const STEPS = [
  {
    icon: Newspaper,
    accent: 'signal' as const,
    title: 'Read the discourse',
    body: 'The agent ingests Nepali civic news and public discussion per project, every tick, from live search feeds.',
  },
  {
    icon: Scale,
    accent: 'signal' as const,
    title: 'Score against the claim',
    body: 'An LLM scores sentiment, the actor, and its stance versus the government’s official claim, with a persisted reasoning trail.',
  },
  {
    icon: ShieldAlert,
    accent: 'civic' as const,
    title: 'Flag the gap',
    body: 'When public sentiment materially contradicts the official claim, the accountability engine flags the gap in the open.',
  },
  {
    icon: Fingerprint,
    accent: 'chain' as const,
    title: 'Anchor on-chain',
    body: 'Citizens confirm a reading behind a zero-knowledge identity proof. One verified human, one voice, recorded permanently.',
  },
];

const ACCENT: Record<'signal' | 'civic' | 'chain', string> = {
  signal: 'text-signal',
  civic: 'text-civic',
  chain: 'text-chain',
};

export function SignalPipeline() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal className="max-w-2xl">
        <h2 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.02em] text-content sm:text-[2.35rem]">
          How the signal works
        </h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-content-muted">
          Four steps run on every tick, from raw discourse to a tamper-proof civic record.
          Each stage is inspectable, so the accountability gap is legible, not asserted.
        </p>
      </Reveal>

      <ol className="relative mt-14 grid gap-y-10 md:grid-cols-4 md:gap-x-6">
        {/* connective spine */}
        <div
          aria-hidden
          className="absolute left-[1.35rem] top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-signal/40 via-line to-chain/40 md:left-0 md:top-[1.65rem] md:h-px md:w-full md:bg-gradient-to-r"
        />
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Reveal as="li" key={step.title} delay={i * 90} className="relative">
              <div className="flex items-center gap-4 md:block">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface shadow-panel">
                  <Icon size={18} strokeWidth={1.75} className={ACCENT[step.accent]} aria-hidden />
                </span>
                <span className="font-mono text-[11px] tracking-[0.2em] text-content-faint md:mt-5 md:block">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-3 text-[16.5px] font-semibold text-content md:mt-2">{step.title}</h3>
              <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-content-muted">
                {step.body}
              </p>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
