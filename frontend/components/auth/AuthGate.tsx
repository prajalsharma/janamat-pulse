'use client';

/**
 * Decides gate | read-only | terminal (spec 4.1 / 4.5). Viewing the terminal is
 * not open to logged-out users at the URL level: they meet the gate first, then
 * either sign in or explicitly choose read-only. Once past, only operator controls
 * and funding are gated (handled inside the header).
 */

import { useState } from 'react';
import { usePrivyState } from '@/lib/usePrivyState';
import { SignInScreen } from './SignInScreen';
import { Terminal } from '../Terminal';
import type { HeaderAuth } from '../Header';

export function AuthGate() {
  const p = usePrivyState();
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Loading: Privy configured but not booted. Never flash the logged-out card.
  if (p.configured && !p.ready) {
    return (
      <SignInScreen
        configured
        ready={false}
        loggingIn={false}
        loginError={null}
        onLogin={() => {}}
        onEnterReadOnly={() => {}}
      />
    );
  }

  const showTerminal = p.authenticated || readOnlyMode;

  if (!showTerminal) {
    return (
      <SignInScreen
        configured={p.configured}
        ready={p.ready}
        loggingIn={p.loggingIn}
        loginError={p.loginError}
        onLogin={p.login}
        onEnterReadOnly={() => setReadOnlyMode(true)}
      />
    );
  }

  const auth: HeaderAuth = {
    configured: p.configured,
    authenticated: p.authenticated,
    readOnly: !p.authenticated,
    solanaWallet: p.solanaWallet,
    email: p.email,
    cluster: 'devnet',
    onSignIn: p.login,
    onDisconnect: async () => {
      await p.logout();
      setReadOnlyMode(false); // On disconnect, the gate returns.
    },
  };

  return <Terminal auth={auth} />;
}
