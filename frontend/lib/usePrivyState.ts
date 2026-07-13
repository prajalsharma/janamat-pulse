'use client';

/**
 * One thin, app-shaped view over Privy so the rest of the UI never touches Privy
 * hooks directly and - crucially - never crashes when Privy is unconfigured.
 *
 * `CONFIGURED` is a build-time constant (env is inlined and never changes between
 * renders), so the top-level branch is stable for the whole app lifetime and the
 * conditional hook call below is safe: the same path runs on every render.
 */

import { useCallback, useState } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';

// Privy's `PrivyErrorCode` is an ambient enum, not a runtime value exported from
// the package root - importing it yields `undefined` at runtime. Compare the
// underlying string value instead. "exited_auth_flow" = user dismissed the modal.
const USER_EXITED_AUTH_FLOW = 'exited_auth_flow';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';

const CONFIGURED = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export interface PrivyState {
  /** Whether a Privy app ID is set. When false, login is off (read-only demo). */
  configured: boolean;
  /** Privy finished booting. Always true when unconfigured (nothing to boot). */
  ready: boolean;
  authenticated: boolean;
  /** Opening-the-Privy-modal in flight. */
  loggingIn: boolean;
  /** Last sign-in error message, or null. */
  loginError: string | null;
  /** Your connected Solana wallet (external or embedded), or null. */
  solanaWallet: ConnectedStandardSolanaWallet | null;
  /** Display handle: email / social email when there is no external address. */
  email: string | null;
  login: () => void;
  clearLoginError: () => void;
  logout: () => Promise<void>;
}

const READ_ONLY: PrivyState = {
  configured: false,
  ready: true,
  authenticated: false,
  loggingIn: false,
  loginError: null,
  solanaWallet: null,
  email: null,
  login: () => {},
  clearLoginError: () => {},
  logout: async () => {},
};

function useConfiguredPrivyState(): PrivyState {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { login } = useLogin({
    onComplete: () => {
      setLoggingIn(false);
      setLoginError(null);
    },
    onError: (err) => {
      setLoggingIn(false);
      // Surface the real Privy error code so failures are diagnosable, not a
      // blanket "cancelled". The console line shows the raw error object too.
      const code = String(err);
      // eslint-disable-next-line no-console
      console.error('[SolVane] Privy sign-in error:', err);
      if (code === USER_EXITED_AUTH_FLOW) {
        // This ALSO fires when a post-auth step (e.g. Solana embedded-wallet
        // provisioning) aborts the flow - not only on a genuine user dismissal.
        setLoginError('Sign-in did not complete. If you finished the code/password step, enable Solana embedded wallets in your Privy dashboard, then retry.');
      } else {
        setLoginError(`Sign-in failed (${code}). Try again.`);
      }
    },
  });

  const startLogin = useCallback(() => {
    setLoginError(null);
    setLoggingIn(true);
    login();
  }, [login]);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  const email = user?.email?.address ?? user?.google?.email ?? null;

  return {
    configured: true,
    ready,
    authenticated,
    loggingIn,
    loginError,
    solanaWallet: wallets[0] ?? null,
    email,
    login: startLogin,
    clearLoginError,
    logout,
  };
}

export function usePrivyState(): PrivyState {
  if (!CONFIGURED) return READ_ONLY;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- CONFIGURED is a stable build-time constant
  return useConfiguredPrivyState();
}
