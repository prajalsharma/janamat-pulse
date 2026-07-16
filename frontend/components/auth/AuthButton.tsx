'use client';

/**
 * Header auth control for Janamat Pulse. Signed out → a clear "Sign in" button
 * that opens Privy social login. Signed in → the shared UserWalletMenu (identity
 * handle + embedded Solana wallet, copy, disconnect). Unconfigured (no
 * NEXT_PUBLIC_PRIVY_APP_ID) → renders nothing and never throws.
 *
 * Honest framing: signing in is social-login identity (one account = one voice
 * per project), not passport-grade personhood.
 */

import { LogIn, Loader2 } from 'lucide-react';
import { usePrivyState } from '@/lib/usePrivyState';
import { UserWalletMenu } from './UserWalletMenu';

const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export function AuthButton({ compact }: { compact?: boolean }) {
  const { configured, ready, authenticated, loggingIn, loginError, email, solanaWallet, login, logout } =
    usePrivyState();

  // Unconfigured → nothing (read-only demo). Never throws.
  if (!configured) return null;

  // Booting Privy: hold a stable-width placeholder so the header doesn't jump.
  if (!ready) {
    return (
      <span
        aria-hidden
        className="inline-flex h-9 w-24 items-center justify-center rounded-md border border-line bg-surface/60"
      >
        <Loader2 size={14} className="animate-spin text-content-faint" />
      </span>
    );
  }

  if (authenticated) {
    return (
      <UserWalletMenu
        solanaWallet={solanaWallet}
        email={email}
        cluster={CLUSTER}
        compact={compact}
        onDisconnect={() => void logout()}
      />
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={login}
        disabled={loggingIn}
        className={`inline-flex h-9 items-center gap-1.5 rounded-md bg-signal px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-signal/90 disabled:opacity-60 cursor-pointer ${FOCUS_RING}`}
      >
        {loggingIn ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <LogIn size={14} aria-hidden />
        )}
        Sign in
      </button>
      {loginError && (
        <span
          role="alert"
          className="mt-1 hidden max-w-[220px] text-right text-[11px] leading-tight text-civic sm:block"
        >
          {loginError}
        </span>
      )}
    </div>
  );
}
