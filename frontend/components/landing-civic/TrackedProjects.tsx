import { MapPin, ArrowUpRight } from 'lucide-react';
import { Reveal } from './Reveal';

interface ProjectView {
  id: number;
  name: string;
  category: number;
  region: string;
  officialClaim: string;
}

const CATEGORY: Record<number, string> = {
  0: 'Infrastructure',
  1: 'Water',
  2: 'Aviation',
  3: 'Policy',
  4: 'Governance',
};

/**
 * Known seed registry (mirrors backend/src/data/civic-projects.seed.ts). Used as a
 * resilient fallback so the page never breaks when the backend is offline during
 * build or SSR. Official claims are the government's asserted status.
 */
const FALLBACK: ProjectView[] = [
  {
    id: 1,
    name: 'Melamchi Water Supply Project',
    category: 1,
    region: 'Kathmandu Valley',
    officialClaim:
      'Water is being delivered to Kathmandu Valley households; monsoon-damage disruptions are being repaired on schedule.',
  },
  {
    id: 2,
    name: 'Pokhara International Airport',
    category: 2,
    region: 'Gandaki / Pokhara',
    officialClaim:
      'The airport is operational and attracting international flights, delivering returns that justify its cost.',
  },
  {
    id: 3,
    name: 'Kathmandu-Terai (Fast Track) Expressway',
    category: 0,
    region: 'Bagmati / Madhesh',
    officialClaim:
      'Construction is progressing toward the revised completion target with no further major delays expected.',
  },
];

/** Editorial framing of the well-documented public record, keyed by project. */
const PUBLIC_RECORD: Record<number, { reality: string; status: 'flagged' | 'watch' }> = {
  1: {
    reality: 'Dry taps return with each monsoon, and residents question a supply promised for decades.',
    status: 'flagged',
  },
  2: {
    reality: 'Sparse international traffic and debt-repayment scrutiny keep the airport’s viability in doubt.',
    status: 'flagged',
  },
  3: {
    reality: 'Repeated deadline slips and budget overruns keep the completion date an open question.',
    status: 'watch',
  },
};

async function getProjects(): Promise<{ projects: ProjectView[]; live: boolean }> {
  const base = process.env.BACKEND_URL || 'http://localhost:4000';
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${base}/api/civic/projects`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as ProjectView[];
    if (!Array.isArray(data) || data.length === 0) throw new Error('empty');
    return { projects: data, live: true };
  } catch {
    return { projects: FALLBACK, live: false };
  }
}

export async function TrackedProjects() {
  const { projects, live } = await getProjects();

  return (
    <section id="projects" className="border-y border-line bg-surface/20">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.02em] text-content sm:text-[2.35rem]">
              Three projects, on the record
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-content-muted">
              Nationally salient public works where the official line and lived experience
              have visibly diverged. The agent tracks each one, claim against sentiment.
            </p>
          </div>
          <span className="inline-flex w-max items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-content-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-signal animate-pulse-dot' : 'bg-content-faint'}`}
              aria-hidden
            />
            {live ? 'LIVE FROM AGENT' : 'SAMPLE REGISTRY'}
          </span>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {projects.slice(0, 3).map((p, i) => {
            const record = PUBLIC_RECORD[p.id] ?? { reality: 'The public conversation is actively tracked this cycle.', status: 'watch' as const };
            return (
              <Reveal as="article" key={p.id} delay={i * 90} className="group flex flex-col rounded-2xl border border-line bg-ink/50 p-1.5 shadow-panel transition-colors duration-300 hover:border-signal/30">
                <div className="flex flex-1 flex-col rounded-[calc(1rem-0.25rem)] border border-line/60 bg-surface/50 p-5">
                  <div className="flex items-center justify-between gap-3 font-mono text-[10.5px] tracking-[0.1em] text-content-faint">
                    <span className="rounded border border-line px-1.5 py-0.5">{CATEGORY[p.category] ?? 'PROJECT'}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} strokeWidth={1.75} aria-hidden />
                      {p.region}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[17px] font-semibold leading-snug text-content">{p.name}</h3>

                  {/* claim */}
                  <div className="mt-4 rounded-xl border border-line bg-chain/[0.06] p-3">
                    <div className="font-mono text-[10px] tracking-[0.1em] text-chain/90">OFFICIAL CLAIM</div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-content-muted">{p.officialClaim}</p>
                  </div>

                  {/* public record */}
                  <div className="mt-3 rounded-xl border border-line bg-civic/[0.06] p-3">
                    <div className="font-mono text-[10px] tracking-[0.1em] text-civic/90">WHAT THE PUBLIC RAISES</div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-content">{record.reality}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <StatusChip status={record.status} />
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-content-faint transition-colors duration-300 group-hover:text-signal">
                      In the pulse
                      <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden />
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {!live && (
          <p className="mt-6 font-mono text-[11.5px] leading-relaxed text-content-muted">
            Showing the seed registry with published official claims. Live sentiment and gap
            scores stream in the pulse once the agent is connected.
          </p>
        )}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: 'flagged' | 'watch' }) {
  if (status === 'flagged') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-civic/40 bg-civic/10 px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.08em] text-civic">
        <span className="h-1.5 w-1.5 rounded-full bg-civic" aria-hidden />
        GAP FLAGGED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.08em] text-content-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-content-faint" aria-hidden />
      UNDER WATCH
    </span>
  );
}
