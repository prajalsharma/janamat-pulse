'use client';

import { ShieldAlert, ShieldCheck, ExternalLink, MessageSquarePlus, MapPin } from 'lucide-react';
import { SentimentMeter } from './SentimentMeter';
import type { AccountabilityFlag, CivicProjectView } from '@/lib/civic';

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
  onCastVoice,
}: {
  project: CivicProjectView;
  flag: AccountabilityFlag | null;
  onCastVoice: (p: CivicProjectView) => void;
}) {
  const flagged = flag?.flagged ?? false;
  const sample = flag?.sampleSize ?? 0;

  return (
    <article className="flex flex-col rounded-xl border border-line bg-surface shadow-panel p-5 transition-colors hover:border-signal/40">
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-content-faint">
          <span className="rounded border border-line px-1.5 py-0.5">{CATEGORY[project.category] ?? 'Project'}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} aria-hidden />
            {project.region}
          </span>
        </div>
        <StatusBadge flagged={flagged} sample={sample} />
      </div>

      <h3 className="mt-3 text-[17px] font-semibold leading-snug text-content">{project.name}</h3>

      {/* official claim */}
      <div className="mt-3 rounded-lg border border-line bg-ink/60 p-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-content-faint">Government's official claim</div>
        <p className="mt-1 text-[13px] leading-relaxed text-content-muted">“{project.officialClaim}”</p>
      </div>

      {/* sentiment */}
      <div className="mt-4">
        <SentimentMeter value={flag?.publicSentiment ?? 0} flagged={flagged} />
      </div>

      {/* summary */}
      <p className="mt-3 text-[12.5px] leading-relaxed text-content-muted min-h-[2.5rem]">
        {flag?.summary ?? 'Awaiting public discourse this cycle.'}
      </p>

      {/* footer actions */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-chain hover:text-chain/80 transition-colors cursor-pointer"
        >
          <ExternalLink size={13} aria-hidden />
          On-chain record
        </a>
        <button
          type="button"
          onClick={() => onCastVoice(project)}
          className="inline-flex items-center gap-1.5 rounded-md border border-signal/40 bg-signal/10 px-2.5 py-1.5 text-[12px] font-medium text-signal transition-colors hover:bg-signal/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          <MessageSquarePlus size={13} aria-hidden />
          Cast your voice
        </button>
      </div>
    </article>
  );
}

function StatusBadge({ flagged, sample }: { flagged: boolean; sample: number }) {
  if (flagged) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-civic/40 bg-civic/10 px-2 py-1 text-[11px] font-medium text-civic">
        <ShieldAlert size={13} aria-hidden />
        Gap flagged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-content-muted">
      <ShieldCheck size={13} aria-hidden />
      {sample > 0 ? 'No gap' : 'Monitoring'}
    </span>
  );
}
