'use client';

import { useEffect, useRef, useState } from 'react';

const EASE = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

/**
 * Animate a numeric value toward its target on change, for a live-instrument
 * feel (stat counters, sentiment readouts). Reduced-motion safe: when the user
 * prefers reduced motion, it snaps to the target with no animation.
 *
 * Returns the current animated value; format at the call site.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || fromRef.current === target) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = from + (target - from) * EASE(t);
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}
