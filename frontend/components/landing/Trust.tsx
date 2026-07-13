import { Eye, SlidersHorizontal, FlaskConical, Route } from 'lucide-react';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const GATES = [
  'Confidence gate: skip trades below the minimum sentiment confidence',
  'Price-movement gate: only act when the tape actually moved',
  'Cooldown: rate-limit churn between trades',
  'Position cap: notional scales with confidence, capped in USD',
  'Slippage cap: a hard bps limit passed to Jupiter',
];

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-20 border-t border-border/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[1160px] px-5">
        <Reveal>
          <SectionHeading
            eyebrow="Why trust it"
            title="Transparency is the product, not the disclaimer"
            lead="An LLM-driven trader is only as trustworthy as what it shows you. SolVane is built to show everything."
          />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Transparent reasoning */}
          <Reveal delay={0}>
            <article className="h-full rounded-2xl border border-border bg-surface p-6 shadow-panel">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-purple/15 text-brand-purple">
                <Eye size={18} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-content">Open reasoning</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
                Every decision records its action, sentiment, score, confidence, the
                rationale behind it, and the exact list of gate reasons for why it was
                approved or held. It all streams to the terminal. Nothing is hidden.
              </p>
              <div className="mt-4 rounded-lg border border-border bg-ink/50 px-3 py-2.5 font-mono text-[11.5px] tnum text-content-muted">
                <span className="text-content">HOLD</span> · bearish · conf 0.41 ·{' '}
                <span className="text-warn">below confidence gate</span>
              </div>
            </article>
          </Reveal>

          {/* Deterministic gates */}
          <Reveal delay={90}>
            <article className="h-full rounded-2xl border border-border bg-surface p-6 shadow-panel">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-purple/15 text-brand-purple">
                <SlidersHorizontal size={18} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-content">Deterministic risk gates</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
                The model never touches your funds directly. Every idea passes through
                fixed, inspectable gates before a swap can happen:
              </p>
              <ul className="mt-4 space-y-2">
                {GATES.map((g) => (
                  <li key={g} className="flex gap-2.5 text-[13px] text-content-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-green" />
                    {g}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>

          {/* Dry-run */}
          <Reveal delay={0}>
            <article className="h-full rounded-2xl border border-border bg-surface p-6 shadow-panel">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-purple/15 text-brand-purple">
                <FlaskConical size={18} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-content">Dry-run by default</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
                Out of the box, with zero keys, SolVane pulls real headlines, fetches
                real prices, and computes real Jupiter quotes, then records{' '}
                <span className="text-content">simulated</span> fills. Nothing about the
                signal is faked; only the money is held back. Going live is an explicit
                opt-in with an API key and a funded wallet.
              </p>
            </article>
          </Reveal>

          {/* Jupiter */}
          <Reveal delay={90}>
            <article className="h-full rounded-2xl border border-border bg-surface p-6 shadow-panel">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-purple/15 text-brand-purple">
                <Route size={18} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-content">Jupiter routing</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
                Swaps route through Jupiter, Solana’s widely-used DEX aggregator, which
                finds the best execution path across venues like Orca and Raydium. Each
                trade in the blotter shows its route label, slippage, and status.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
