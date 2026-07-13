import { Reveal } from './Reveal';

const STACK = [
  { name: 'Solana', role: 'Execution layer' },
  { name: 'Jupiter', role: 'DEX aggregator · routing' },
  { name: 'Claude', role: 'Sentiment scoring' },
  { name: 'Pyth', role: 'Price oracle' },
];

export function TechStrip() {
  return (
    <section className="border-t border-border/60 py-14">
      <div className="mx-auto max-w-[1160px] px-5">
        <Reveal>
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-content-muted">
            Built on
          </p>
        </Reveal>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STACK.map((s, i) => (
            <Reveal key={s.name} delay={i * 70}>
              <div className="rounded-xl border border-border bg-surface/70 px-4 py-4 text-center transition-colors duration-200 hover:border-brand-purple/40">
                <div className="text-[15px] font-semibold tracking-tight text-content">{s.name}</div>
                <div className="mt-1 text-[11.5px] text-content-muted">{s.role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
