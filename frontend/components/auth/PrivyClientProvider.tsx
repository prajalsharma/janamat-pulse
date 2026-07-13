'use client';

/**
 * Mounts Privy for the whole app. Solana-first: email + social + external Solana
 * wallets, plus a Solana embedded wallet created on login for users without one,
 * so every authenticated user has an address to fund the agent from.
 *
 * CRITICAL: when NEXT_PUBLIC_PRIVY_APP_ID is unset the provider is NOT mounted and
 * never throws - children render directly and the app runs in read-only demo mode.
 */

import { useMemo, type ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function PrivyClientProvider({ children }: { children: ReactNode }) {
  // Phantom / Backpack / Solflare via wallet-standard. getWallets() touches
  // `window`, so build connectors in the browser only - never during SSR.
  const solanaConnectors = useMemo(
    () => (typeof window === 'undefined' ? undefined : toSolanaWalletConnectors()),
    [],
  );

  if (!APP_ID) {
    // Unconfigured → keyless. No provider, no throw.
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        // Only offer methods actually enabled on the Privy dashboard. Google
        // OAuth is off server-side for this app, so offering it just produces a
        // broken flow. Re-add 'google' here once it's enabled in the dashboard.
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#9945FF',
          logo: '/icon.svg',
          walletChainType: 'solana-only',
        },
        embeddedWallets: {
          solana: { createOnLogin: 'users-without-wallets' },
        },
        externalWallets: solanaConnectors ? { solana: { connectors: solanaConnectors } } : undefined,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
