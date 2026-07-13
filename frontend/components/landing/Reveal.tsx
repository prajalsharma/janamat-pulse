'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance. Content starts translated + transparent and eases
 * into place once it enters the viewport. `delay` staggers siblings.
 *
 * Motion is opt-out safe: `motion-reduce:` utilities force the resting state so
 * users with `prefers-reduced-motion` always see fully-visible content, and if
 * the IntersectionObserver never fires the resting classes still apply on show.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={[
        'transition-[opacity,transform] duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
        'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  );
}
