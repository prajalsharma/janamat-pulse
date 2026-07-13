import Link from 'next/link';
import { Mark } from './Mark';

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
  { href: '#terminal', label: 'Terminal' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Mark />
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-content-muted">
            Autonomous news-sentiment trading agent for Solana. Runs live in dry-run.
            Real signal, simulated fills. Not financial advice.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md text-[13px] text-content-muted transition-colors duration-150 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              {n.label}
            </a>
          ))}
          <Link
            href="/app"
            className="rounded-md text-[13px] font-medium text-brand-green transition-colors duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
          >
            Launch Terminal
          </Link>
        </nav>
      </div>
    </footer>
  );
}
