import { ScrollText, Lock, Fingerprint, Network } from 'lucide-react';
import { Reveal } from './Reveal';

export function WhyItMatters() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal className="max-w-2xl">
        <h2 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.02em] text-content sm:text-[2.35rem]">
          Why put civic opinion on a ledger
        </h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-content-muted">
          Public frustration scattered across feeds can be ignored, altered, or deleted. A
          permanent, sybil-resistant record makes the accountability gap hard to wave away.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-6">
        {/* Feature cell with a reasoning-trail motif */}
        <Reveal className="md:col-span-3">
          <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/50 p-6 shadow-panel">
            <div
              aria-hidden
              className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.12),transparent_70%)]"
            />
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink">
              <ScrollText size={18} strokeWidth={1.75} className="text-signal" aria-hidden />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-content">Transparent reasoning, not a black box</h3>
            <p className="mt-2 max-w-[42ch] text-[13.5px] leading-relaxed text-content-muted">
              Every reading carries a persisted rationale: the sentiment, the actor, the claim it
              reacts to, and its stance. You can audit why the agent scored what it scored.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2 font-mono text-[10.5px] tracking-[0.08em] text-content-faint">
              {['SENTIMENT', 'ACTOR', 'CLAIM', 'STANCE', 'RATIONALE'].map((t) => (
                <li key={t} className="rounded border border-line bg-ink/60 px-2 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </article>
        </Reveal>

        <Reveal delay={90} className="md:col-span-3">
          <article className="flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-6 shadow-panel">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink">
              <Lock size={18} strokeWidth={1.75} className="text-chain" aria-hidden />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-content">A tamper-proof public record</h3>
            <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-content-muted">
              Verified readings anchor on Solana as immutable records. Once written, the gap between
              claim and sentiment cannot be quietly edited or deleted. The program is live on devnet.
            </p>
          </article>
        </Reveal>

        <Reveal delay={60} className="md:col-span-2">
          <article className="flex h-full flex-col rounded-2xl border border-line bg-chain/[0.05] p-6 shadow-panel">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink">
              <Fingerprint size={18} strokeWidth={1.75} className="text-chain" aria-hidden />
            </span>
            <h3 className="mt-4 text-[16.5px] font-semibold text-content">One human, one voice</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-content-muted">
              A zero-knowledge citizenship proof yields one nullifier per person, per project. Sybil
              floods and bot brigades cannot drown out real voices.
            </p>
          </article>
        </Reveal>

        <Reveal delay={150} className="md:col-span-4">
          <article className="flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-6 shadow-panel">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink">
              <Network size={18} strokeWidth={1.75} className="text-signal" aria-hidden />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-content">It complements Janamat</h3>
            <p className="mt-2 max-w-[60ch] text-[13.5px] leading-relaxed text-content-muted">
              Janamat put public opinion on-chain to make it immutable. Janamat Pulse adds the missing
              automated layer: an agent that measures that opinion at scale, attributes it to specific
              projects, and turns the public square into a continuous accountability signal.
            </p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
