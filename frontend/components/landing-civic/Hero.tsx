'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

const EXPLORER =
  'https://explorer.solana.com/address/GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu?cluster=devnet';

export function Hero() {
  return (
    <header className="relative overflow-hidden">
      {/* signature backdrop: one low-intensity signal beam, brand hues only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.10),transparent_72%)]" />
        <div className="absolute right-[-10rem] top-[6rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,rgba(153,69,255,0.09),transparent_72%)]" />
        <div className="hero-grid absolute inset-0 opacity-[0.5]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:pb-28 md:pt-24">
        <div className="hero-enter">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-content-muted backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-signal/60 hero-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            CIVIC ACCOUNTABILITY, ON SOLANA
          </span>

          <h1 className="mt-6 text-balance text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.02em] text-content sm:text-5xl md:text-[3.35rem]">
            What the <span className="text-signal">public says</span>, weighed against the official claim.
          </h1>

          <p className="mt-6 max-w-[46ch] text-[15.5px] leading-relaxed text-content-muted">
            An AI agent reads Nepal&apos;s civic discourse, scores it against each government
            claim, and records the gap on Solana. One verified human, one voice.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
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

        <div className="hero-enter hero-enter-2">
          <ClaimVsSentiment />
        </div>
      </div>

      <StyleBlock />
    </header>
  );
}

/**
 * Signature hero effect: the government's flat "official claim" line versus the
 * live public-sentiment pulse, with the divergence between them shaded as the
 * accountability gap. Illustrative motion, labelled as such.
 */
function ClaimVsSentiment() {
  const claim = 'M0,60 C120,54 240,52 400,50';
  const sentiment =
    'M0,98 L36,98 L62,150 L96,120 L138,170 L184,112 L232,176 L286,150 L340,180 L400,172';
  // Closed gap band = claim line across the top, sentiment line back across the bottom.
  const gap = `${claim} L400,172 L340,180 L286,150 L232,176 L184,112 L138,170 L96,120 L62,150 L36,98 L0,98 Z`;

  return (
    <div className="relative rounded-[1.75rem] border border-line bg-surface/40 p-1.5 shadow-panel backdrop-blur-sm">
      <div className="rounded-[calc(1.75rem-0.375rem)] border border-line/70 bg-ink/70 p-5 shadow-[inset_0_1px_0_rgba(245,247,250,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulse-dot" aria-hidden />
            <span className="font-mono text-[11px] tracking-[0.12em] text-content-muted">
              MELAMCHI WATER SUPPLY
            </span>
          </div>
          <span className="rounded-md border border-civic/40 bg-civic/10 px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.1em] text-civic">
            GAP FLAGGED
          </span>
        </div>

        <svg
          viewBox="0 0 400 200"
          className="mt-4 w-full"
          role="img"
          aria-label="Illustrative chart: the flat official claim line sits well above the dipping public-sentiment line; the divergence between them is shaded as the accountability gap."
        >
          <defs>
            <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E23252" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#E23252" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {[40, 90, 140].map((y) => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1E2A45" strokeWidth="1" strokeDasharray="2 6" />
          ))}

          <path className="hero-gap" d={gap} fill="url(#gapFill)" stroke="none" />

          <path
            d={claim}
            fill="none"
            stroke="#9945FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 7"
            opacity="0.9"
          />

          <path
            className="hero-line"
            d={sentiment}
            fill="none"
            stroke="#22D3EE"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle className="hero-tip" cx="400" cy="172" r="4.5" fill="#22D3EE" />
        </svg>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <Legend swatch="#9945FF" label="Official claim" value="On schedule" />
          <Legend swatch="#22D3EE" label="Public sentiment" value="-61" mono />
          <Legend swatch="#E23252" label="Gap" value="Flagged" />
        </div>

        <p className="mt-3 font-mono text-[10px] leading-relaxed text-content-faint">
          Illustrative readout. Live figures update in the pulse.
        </p>
      </div>
    </div>
  );
}

function Legend({ swatch, label, value, mono }: { swatch: string; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-3.5 rounded-full" style={{ background: swatch }} aria-hidden />
        <span className="truncate font-mono text-[10px] tracking-[0.08em] text-content-faint">{label}</span>
      </div>
      <div className={`mt-1 text-[13px] font-medium text-content ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style jsx global>{`
      .hero-grid {
        background-image:
          linear-gradient(to right, rgba(30, 42, 69, 0.5) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(30, 42, 69, 0.5) 1px, transparent 1px);
        background-size: 46px 46px;
        mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 78%);
      }
      .hero-enter {
        animation: hero-rise 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .hero-enter-2 {
        animation-delay: 140ms;
      }
      .hero-ping {
        animation: hero-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
      .hero-line {
        stroke-dasharray: 900;
        stroke-dashoffset: 900;
        animation: hero-draw 1500ms cubic-bezier(0.22, 1, 0.36, 1) 260ms forwards;
      }
      .hero-tip {
        opacity: 0;
        animation: hero-fade 500ms ease-out 1500ms forwards, hero-pulse 2.4s ease-out 1800ms infinite;
      }
      .hero-gap {
        opacity: 0;
        animation: hero-fade 900ms ease-out 900ms forwards;
      }
      @keyframes hero-rise {
        from {
          opacity: 0;
          transform: translate3d(0, 22px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
      @keyframes hero-draw {
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes hero-fade {
        to {
          opacity: 1;
        }
      }
      @keyframes hero-ping {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        70%,
        100% {
          transform: scale(2.6);
          opacity: 0;
        }
      }
      @keyframes hero-pulse {
        0% {
          r: 4.5;
        }
        50% {
          r: 6;
        }
        100% {
          r: 4.5;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-enter,
        .hero-enter-2,
        .hero-ping,
        .hero-line,
        .hero-tip,
        .hero-gap {
          animation: none;
        }
        .hero-line {
          stroke-dashoffset: 0;
        }
        .hero-tip,
        .hero-gap {
          opacity: 1;
        }
      }
    `}</style>
  );
}
