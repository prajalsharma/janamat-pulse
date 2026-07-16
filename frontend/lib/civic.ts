'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Mirrors the backend civic domain types (backend/src/types/civic.ts). */
export type Stance = 'corroborates' | 'disputes' | 'neutral';

export interface CivicProjectView {
  id: number;
  name: string;
  category: number;
  region: string;
  officialClaim: string;
}

export interface CivicSentiment {
  projectId: number | null;
  category: number;
  actor: string | null;
  sentiment: number; // -100..100
  confidence: number; // 0..100
  claim: string | null;
  stance: Stance;
  rationale: string;
}

export interface AccountabilityFlag {
  projectId: number;
  officialClaim: string;
  publicSentiment: number;
  sampleSize: number;
  flagged: boolean;
  gap: number;
  summary: string;
}

export interface CivicPulseSnapshot {
  at: number | null;
  ticks?: number;
  engine?: 'claude' | 'heuristic';
  usingSimulated?: boolean;
  items: CivicSentiment[];
  flags: AccountabilityFlag[];
  projects: CivicProjectView[];
}

export interface OpinionResult {
  ok: true;
  projectId: number;
  nullifier: string;
  onChain: boolean;
  signature: string | null;
  voicePda: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json() as Promise<T>;
}

/**
 * Live civic pulse: loads tracked projects + latest snapshot, then polls.
 * Falls back gracefully and never throws into render.
 */
export function useCivicPulse(pollMs = 6000) {
  const [projects, setProjects] = useState<CivicProjectView[]>([]);
  const [snapshot, setSnapshot] = useState<CivicPulseSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPulse = useCallback(async () => {
    try {
      const snap = await getJson<CivicPulseSnapshot>('/api/civic/pulse');
      setSnapshot(snap);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const snap = await getJson<CivicPulseSnapshot>('/api/civic/tick');
      setSnapshot(snap);
      setError(null);
    } catch (e) {
      // /tick is POST; fall back to a plain pulse read
      await loadPulse();
    } finally {
      setRefreshing(false);
    }
  }, [loadPulse]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [p] = await Promise.all([
          getJson<CivicProjectView[]>('/api/civic/projects'),
          loadPulse(),
        ]);
        if (live) setProjects(p);
      } catch (e) {
        if (live) setError((e as Error).message);
      } finally {
        if (live) setLoading(false);
      }
    })();
    timer.current = setInterval(loadPulse, pollMs);
    return () => {
      live = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [loadPulse, pollMs]);

  return { projects, snapshot, loading, error, refreshing, refresh };
}

/** Trigger one civic cycle on the backend (POST). */
export async function triggerTick(): Promise<CivicPulseSnapshot | null> {
  try {
    const r = await fetch('/api/civic/tick', { method: 'POST' });
    return r.ok ? ((await r.json()) as CivicPulseSnapshot) : null;
  } catch {
    return null;
  }
}

/**
 * Submit a civic opinion. Identity is the caller's Privy access token: the
 * backend verifies it and maps the stable Privy user id to a per-project
 * nullifier, so one signed-in account = one voice per project.
 */
export async function castOpinion(input: {
  projectId: number;
  sentiment: number;
  confidence: number;
  accessToken: string; // Privy access token (JWT) from getAccessToken()
}): Promise<OpinionResult> {
  const scope = `janamat-pulse:project:${input.projectId}`;
  const r = await fetch('/api/civic/opinion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: input.projectId,
      sentiment: input.sentiment,
      confidence: input.confidence,
      proof: { scheme: 'privy', payload: input.accessToken, scope },
    }),
  });
  const data = await r.json();
  if (!r.ok || data?.error) throw new Error(data?.error ?? `opinion → ${r.status}`);
  return data as OpinionResult;
}

/** Look up the flag for a project in the current snapshot. */
export function flagFor(
  snapshot: CivicPulseSnapshot | null,
  projectId: number,
): AccountabilityFlag | null {
  return snapshot?.flags.find((f) => f.projectId === projectId) ?? null;
}
