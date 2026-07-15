import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Wordmark } from '@/components/civic/Logo';

export function LandingNav() {
  return (
    <div className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          aria-label="Janamat Pulse home"
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="#how"
            className="hidden rounded-md px-3 py-2 text-[13px] font-medium text-content-muted transition-colors hover:text-content sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
          >
            How it works
          </Link>
          <Link
            href="#projects"
            className="hidden rounded-md px-3 py-2 text-[13px] font-medium text-content-muted transition-colors hover:text-content sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
          >
            Projects
          </Link>
          <Link
            href="/app"
            className="group ml-1 inline-flex items-center gap-2 rounded-full bg-signal py-2 pl-4 pr-2 text-[13px] font-semibold text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-signal-glow active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Open the pulse
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/15 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
