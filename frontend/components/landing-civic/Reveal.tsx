'use client';

import { useEffect, useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * SSR-safe, reduced-motion-safe scroll reveal.
 *
 * Content is fully visible by default (server render + no-JS + reduced motion all
 * ship the real thing, never a blank section). Only after mount, when motion is
 * allowed and IntersectionObserver exists, do we hide-then-reveal on scroll. The
 * hide is applied in a layout effect (before paint) so there is no visible flash.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  y = 20,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') return;

    // Set the hidden pre-state before the browser paints, then transition in.
    el.style.opacity = '0';
    el.style.transform = `translate3d(0, ${y}px, 0)`;
    el.style.transition = `opacity 720ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 720ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
    el.style.willChange = 'opacity, transform';

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.opacity = '1';
            el.style.transform = 'translate3d(0, 0, 0)';
            io.unobserve(el);
            window.setTimeout(() => {
              el.style.willChange = 'auto';
            }, 800 + delay);
          }
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, y]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
