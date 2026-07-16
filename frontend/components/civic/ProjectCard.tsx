'use client';

import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  MessageSquarePlus,
  MapPin,
  Newspaper,
} from 'lucide-react';
import { SentimentMeter } from './SentimentMeter';
import { relTime } from '@/lib/format';
import type { AccountabilityFlag, CivicHeadlineItem, CivicProjectView } from '@/lib/civic';

const CATEGORY: Record<number, string> = {
  0: 'Infrastructure',
  1: 'Water',
  2: 'Aviation',
  3: 'Policy',
  4: 'Governance',
};

const PROGRAM_ID = 'GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu';
const explorer = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;

export function ProjectCard({
  project,
  flag,
  headlines = [],
  index = 0,
  onCastVoice,
}: {
  project: CivicProjectView;
  flag: AccountabilityFlag | null;
  headlines?: CivicHeadlineItem[];
  index?: number;
  onCastVoice: (p: CivicProjectView) => void;
}) {
  const flagged = flag?.flagged ?? false;
  const sample = flag?.sampleSize ?? 0;
  const gap = flag?.gap ?? null;

  return (
    <article
      className="group flex animate-rise flex-col rounded-xl border border-line bg-surface p-5 shadow-panel transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-[0_14px_44px_-18px_rgba(34,211,238,0.4)]"
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-content-faint">
          <span className="rounded border border-line px-1.5 py-0.5">
            {CATEGORY[project.category] ?? 'Project'}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} strokeWidth={1.75} aria-hidden />
            {project.region}
          </span>
        </div>
        <StatusBadge flagged={flagged} sample={sample} />
      </div>

      <h3 className="mt-3 text-[17px] font-semibold leading-snug text-content">{project.name}</h3>

      {/* official claim */}
      <div className="mt-3 rounded-lg border border-line bg-chain/[0.06] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] text-chain/90">
            Government&apos;s official claim
          </div>
          {gap != null && sample > 0 && (
            <span
              className={`tnum font-mono text-[10px] font-medium ${flagged ? 'text-civic' : 'text-content-faint'}`}
            >
              gap {Math.round(gap)}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-content-muted">
          &ldquo;{project.officialClaim}&rdquo;
        </p>
      </div>

      {/* sentiment vs claim */}
      <div className="mt-4">
        <SentimentMeter value={flag?.publicSentiment ?? 0} flagged={flagged} />
      </div>

      {/* agent summary */}
      <p className="mt-3 text-[12.5px] leading-relaxed text-content-muted">
        {flag?.summary ?? 'Awaiting public discourse this cycle.'}
      </p>

      {/* real recent coverage */}
      <CoverageRail headlines={headlines} />

      {/* footer actions */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded text-[12px] text-chain transition-colors hover:text-chain/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-chain/50 cursor-pointer"
        >
          <ExternalLink size={13} strokeWidth={1.75} aria-hidden />
          On-chain record
        </a>
        <button
          type="button"
          onClick={() => onCastVoice(project)}
          className="inline-flex items-center gap-1.5 rounded-md border border-signal/40 bg-signal/10 px-2.5 py-1.5 text-[12px] font-medium text-signal transition-colors hover:bg-signal/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          <MessageSquarePlus size={13} strokeWidth={1.75} aria-hidden />
          Cast your voice
        </button>
      </div>
    </article>
  );
}

/** Top real news attributed to this project: source + relative time, links out. */
function CoverageRail({ headlines }: { headlines: CivicHeadlineItem[] }) {
  const items = headlines.slice(0, 3);
  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-content-faint">
        <Newspaper size={11} strokeWidth={1.75} aria-hidden />
        Recent coverage
      </div>
      {items.length === 0 ? (
        <p className="py-1 text-[12px] leading-relaxed text-content-faint">
          Live coverage streams in with the agent.
        </p>
      ) : (
        <ul className="-mx-2">
          {items.map((h, i) => (
            <li key={`${h.link}-${i}`}>
              <a
                href={h.link}
                target="_blank"
                rel="noreferrer"
                className="group/hl flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.035] focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 cursor-pointer"
              >
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-signal/70"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[12.5px] leading-snug text-content-muted transition-colors group-hover/hl:text-content">
                    {h.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-content-faint">
                    <span className="max-w-[9rem] truncate text-content-muted/80">{h.source}</span>
                    {relTime(h.publishedAt) && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="tnum">{relTime(h.publishedAt)}</span>
                      </>
                    )}
                  </span>
                </span>
                <ExternalLink
                  size={12}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-content-faint opacity-0 transition-opacity group-hover/hl:opacity-100"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ flagged, sample }: { flagged: boolean; sample: number }) {
  if (flagged) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-civic/40 bg-civic/10 px-2 py-1 text-[11px] font-medium text-civic">
        <ShieldAlert size={13} strokeWidth={1.75} aria-hidden />
        Gap flagged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-content-muted">
      <ShieldCheck size={13} strokeWidth={1.75} aria-hidden />
      {sample > 0 ? 'No gap' : 'Monitoring'}
    </span>
  );
}
