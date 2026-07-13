'use client';

/**
 * The one brand moment inside the product: a single centered gate. Renders the
 * SolVane backdrop behind it so it reads as SolVane, not a blank auth page.
 * Handles logged-out, logging-in, error, loading, and the Privy-unconfigured
 * variant (spec 4.1 / 4.5).
 */

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '../Logo';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export function SignInScreen({
  configured,
  ready,
  loggingIn,
  loginError,
  onLogin,
  onEnterReadOnly,
}: {
  configured: boolean;
  ready: boolean;
  loggingIn: boolean;
  loginError: string | null;
  onLogin: () => void;
  onEnterReadOnly: () => void;
}) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const loading = configured && !ready;

  useEffect(() => {
    if (!loading) primaryRef.current?.focus();
  }, [loading]);

  return (
    <div className="grid min-h-[100dvh] place-items-center px-5">
      <div className="w-full max-w-[420px] animate-fade-up rounded-xl border border-border bg-surface/80 px-7 py-8 shadow-panel backdrop-blur-xl">
        <div className="flex justify-center">
          <Logo size={40} />
        </div>

        {loading ? (
          // Loading (Privy not ready): skeleton matching the final shape.
          <div className="mt-7 space-y-3" aria-hidden>
            <div className="h-4 w-3/4 animate-pulse rounded-md bg-surface-2/60" />
            <div className="h-4 w-full animate-pulse rounded-md bg-surface-2/60" />
            <div className="mt-5 h-11 w-full animate-pulse rounded-md bg-surface-2/60" />
          </div>
        ) : configured ? (
          <>
            <h1 className="mt-6 text-center text-xl font-semibold text-content">
              Sign in to operate the agent
            </h1>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-content-muted">
              Viewing is open to everyone. Sign in to start, pause, and fund the
              SolVane agent.
            </p>

            <button
              ref={primaryRef}
              onClick={onLogin}
              disabled={loggingIn}
              aria-busy={loggingIn}
              className={`mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-beam text-sm font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-80 ${FOCUS_RING}`}
            >
              {loggingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Opening Privy...
                </>
              ) : (
                'Sign in with Privy'
              )}
            </button>

            {loginError && (
              <p className="mt-2 text-center text-[12.5px] text-bear" role="alert">
                {loginError}
              </p>
            )}

            <div className="my-5 h-px bg-border" />

            <div className="text-center">
              <button
                onClick={onEnterReadOnly}
                className={`rounded-md text-[13px] text-content-muted transition-colors duration-100 hover:text-content ${FOCUS_RING}`}
              >
                Continue in read-only demo
              </button>
            </div>
          </>
        ) : (
          // Unconfigured variant (spec 4.5): login is off, offer read-only.
          <>
            <h1 className="mt-6 text-center text-xl font-semibold text-content">
              Sign-in is not configured
            </h1>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-content-muted">
              No Privy app ID is set, so login is off. You can still watch the
              agent trade in read-only mode.
            </p>

            <button
              ref={primaryRef}
              onClick={onEnterReadOnly}
              className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-beam text-sm font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px ${FOCUS_RING}`}
            >
              Enter read-only demo
            </button>
          </>
        )}

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-content-muted">
          Devnet. Dry-run by default. No funds move unless you fund the agent.
        </p>
      </div>
    </div>
  );
}
