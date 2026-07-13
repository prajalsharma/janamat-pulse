'use client';

/**
 * Polls the agent vault snapshot from `/api/wallet` (the bot's server keypair -
 * NOT the user). Owns the up/down balance flash so both the header chip and the
 * fund modal read one canonical vault balance. Extracted from the former
 * WalletChip so the fund flow and the chip share a single source of truth.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AgentVault {
  address: string;
  cluster: string;
  solBalance: number;
  usdcBalance: number;
  canAirdrop: boolean;
  explorerUrl: string;
}

export type Flash = 'up' | 'down' | null;

export function useAgentWallet(fallbackAddr: string | null) {
  const [vault, setVault] = useState<AgentVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);
  const prevBal = useRef<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/wallet');
      if (!r.ok) throw new Error(String(r.status));
      const w: AgentVault = await r.json();
      setVault(w);
      if (prevBal.current != null && w.solBalance !== prevBal.current) {
        setFlash(w.solBalance > prevBal.current ? 'up' : 'down');
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(null), 600);
      }
      prevBal.current = w.solBalance;
    } catch {
      // Backend may be briefly unavailable; keep last-known vault, drop spinner.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 15_000);
    return () => {
      clearInterval(id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [refresh]);

  const address = vault?.address ?? fallbackAddr;

  return { vault, address, loading, flash, refresh };
}
