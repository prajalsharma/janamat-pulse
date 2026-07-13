import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Mark } from './Mark';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
  { href: '#terminal', label: 'Terminal' },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1160px] items-center gap-6 px-5 py-3.5">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
          aria-label="SolVane home"
        >
          <Mark />
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-content-muted transition-colors duration-150 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          href="/app"
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg bg-beam px-4 text-sm font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink active:translate-y-px md:ml-0"
        >
          Launch Terminal
          <ArrowUpRight size={15} strokeWidth={2.5} />
        </Link>
      </nav>
    </header>
  );
}
