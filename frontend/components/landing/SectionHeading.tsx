import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-purple">
        <span className="h-px w-6 bg-beam" />
        {eyebrow}
      </div>
      <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-content sm:text-[2rem] sm:leading-[1.15]">
        {title}
      </h2>
      {lead && <p className="mt-3 text-pretty text-[15px] leading-relaxed text-content-muted">{lead}</p>}
    </div>
  );
}
