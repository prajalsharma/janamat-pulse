import Link from 'next/link';
import { ArrowRight, Radio, ShieldAlert, Fingerprint, Link2 } from 'lucide-react';
import { Wordmark } from '@/components/civic/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* nav */}
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Wordmark />
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-signal/90 cursor-pointer"
          >
            Open the pulse
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </nav>

      {/* hero */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-content-muted">
              <Radio size={13} className="text-signal" aria-hidden />
              Civic signal, recorded on Solana
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-content sm:text-5xl">
              What the public actually says,
              <span className="text-signal"> versus what the government claims.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-content-muted">
              Janamat Pulse is an AI agent that reads Nepal's civic discourse, measures public
              sentiment on government projects, and anchors a tamper-proof record on-chain. One
              verified human, one voice. It complements Janamat's public square with an automated
              accountability signal.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-signal/90 cursor-pointer"
              >
                See the live pulse
                <ArrowRight size={16} aria-hidden />
              </Link>
              <a
                href="https://explorer.solana.com/address/GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu?cluster=devnet"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-line px-5 py-3 text-[14px] font-medium text-content-muted transition-colors hover:text-content hover:border-chain/40 cursor-pointer"
              >
                <Link2 size={16} className="text-chain" aria-hidden />
                View the program
              </a>
            </div>
          </div>

          {/* hero pulse visual */}
          <PulseVisual />
        </div>
      </header>

      {/* how it works — icon-led, no numbered scaffold */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-[13px] uppercase tracking-[0.18em] text-content-faint">How the signal works</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Step
            icon={<Radio size={18} className="text-signal" />}
            title="Measure"
            body="The agent ingests civic news and scores public sentiment on each project against the government's official claim, with a transparent reasoning trail."
          />
          <Step
            icon={<ShieldAlert size={18} className="text-civic" />}
            title="Flag the gap"
            body="When public sentiment materially contradicts the official claim, the accountability engine flags the gap for everyone to see."
          />
          <Step
            icon={<Fingerprint size={18} className="text-chain" />}
            title="Record, one voice each"
            body="Citizens confirm sentiment behind a zero-knowledge identity proof. One verified human equals one on-chain voice, unlinkable and permanent."
          />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-[12px] text-content-faint sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <span>A civic-transparency prototype. No token, no trading. Solana as a public ledger.</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-ink">{icon}</div>
      <h3 className="mt-3 text-[16px] font-semibold text-content">{title}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-content-muted">{body}</p>
    </div>
  );
}

/** Decorative civic-signal waveform echoing the logo mark. Respects reduced-motion via CSS. */
function PulseVisual() {
  return (
    <div className="relative hidden md:block">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.14em] text-content-faint">Public sentiment</span>
          <span className="h-2 w-2 rounded-full bg-signal animate-pulse-dot" aria-hidden />
        </div>
        <svg viewBox="0 0 320 120" className="mt-4 w-full" role="img" aria-label="Illustrative sentiment pulse">
          <line x1="0" y1="60" x2="320" y2="60" stroke="#1E2A45" strokeWidth="1" />
          <circle cx="14" cy="72" r="4" fill="#E23252" />
          <path
            d="M14,72 L60,72 L78,40 L96,72 L130,72 L150,96 L186,20 L220,72 L320,72"
            fill="none"
            stroke="#22D3EE"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M186,20 L230,20 L250,52 L270,20 L320,20" fill="none" stroke="#9945FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="320" cy="20" r="4" fill="#22D3EE" />
        </svg>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { k: 'Melamchi', v: 'Disputed', c: 'text-civic' },
            { k: 'Pokhara', v: 'Disputed', c: 'text-civic' },
            { k: 'Fast Track', v: 'Mixed', c: 'text-content-muted' },
          ].map((x) => (
            <div key={x.k} className="rounded-lg border border-line bg-ink px-2 py-2">
              <div className="truncate text-[11px] text-content-faint">{x.k}</div>
              <div className={`text-[12px] font-medium ${x.c}`}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
