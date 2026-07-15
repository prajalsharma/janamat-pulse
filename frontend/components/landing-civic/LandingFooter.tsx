import { Wordmark } from '@/components/civic/Logo';

const EXPLORER =
  'https://explorer.solana.com/address/GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu?cluster=devnet';

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <Wordmark />
            <p className="mt-4 text-[13px] leading-relaxed text-content-muted">
              An agentic civic-accountability layer for Solana. It measures public sentiment on
              government projects and records the gap against each official claim.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 font-mono text-[12px]">
            <span className="tracking-[0.12em] text-content-faint">PROGRAM · SOLANA DEVNET</span>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noreferrer"
              className="w-max rounded-md text-chain transition-colors hover:text-chain/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-chain/50"
            >
              GQ9X…NUwu ↗
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="max-w-3xl text-[12px] leading-relaxed text-content-muted">
            A civic-transparency prototype. Not an official government record and not financial
            advice. No token and no trading. Solana is used here as a public ledger, not money.
            Official claims are illustrative and should be sourced from official statements before
            any public launch.
          </p>
        </div>
      </div>
    </footer>
  );
}
