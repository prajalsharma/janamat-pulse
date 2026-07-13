'use client';

/**
 * YOUR-wallet identity menu (spec 4.3, Zone C). Neutral by rule: no purple, no
 * signal color - the identicon and address carry identity, nothing brand. Portal
 * + fixed positioning escapes the sticky header's stacking context. Disconnect is
 * destructive and spatially separated.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { ArrowUpRight, Check, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';
import { shortAddr } from '@/lib/format';
import { Identicon } from './Identicon';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

function fmtSol(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function accountExplorer(addr: string, cluster: string): string {
  return `https://solscan.io/account/${addr}` + (cluster === 'devnet' ? '?cluster=devnet' : '');
}

export function UserWalletMenu({
  solanaWallet,
  email,
  cluster,
  compact,
  onFund,
  onDisconnect,
}: {
  solanaWallet: ConnectedStandardSolanaWallet | null;
  email: string | null;
  cluster: string;
  compact?: boolean;
  onFund: () => void;
  onDisconnect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const address = solanaWallet?.address ?? null;
  // Identity label: external/embedded address, else the email local-part.
  const label = address ? shortAddr(address) : email ? email.split('@')[0] : 'Account';

  const position = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, []);

  useEffect(() => {
    if (!open) return;
    position();
    void (async () => {
      if (!address) return;
      try {
        const conn = new Connection(RPC, 'confirmed');
        const lamports = await conn.getBalance(new PublicKey(address));
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        setBalance(null);
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = menuRef.current?.querySelectorAll<HTMLElement>('[data-menuitem]');
        if (!items || items.length === 0) return;
        const arr = Array.from(items);
        const i = arr.indexOf(document.activeElement as HTMLElement);
        const next =
          e.key === 'ArrowDown'
            ? arr[(i + 1) % arr.length]
            : arr[(i - 1 + arr.length) % arr.length];
        next.focus();
      }
    };
    const onDocMouse = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    document.addEventListener('mousedown', onDocMouse);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      document.removeEventListener('mousedown', onDocMouse);
    };
  }, [open, address, position]);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rowCls = `flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-content transition-colors duration-100 hover:bg-surface-2 ${FOCUS_RING}`;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your wallet menu"
        className={`inline-flex h-9 items-center gap-2 rounded-md border bg-surface-2 pl-1.5 pr-2.5 transition-colors duration-100 ${
          open ? 'border-content/20' : 'border-border hover:border-content/15'
        } ${FOCUS_RING}`}
      >
        {address ? (
          <Identicon address={address} size={22} />
        ) : (
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[5px] bg-surface text-[11px] font-medium text-content-muted">
            {(email?.[0] ?? '?').toUpperCase()}
          </span>
        )}
        {!compact && (
          <span className="font-mono text-[12px] text-content-muted">{label}</span>
        )}
        <ChevronDown size={14} className="text-content-muted" aria-hidden />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, right: coords.right }}
            className="z-[90] w-64 animate-fade-up rounded-xl border border-border bg-surface p-1.5 shadow-panel"
          >
            {/* Identity block */}
            <div className="px-2.5 py-2">
              <div className="text-[11px] uppercase tracking-wide text-content-muted">
                Signed in
              </div>
              {email && (
                <div className="mt-1 truncate text-[13px] text-content">{email}</div>
              )}
              {address && (
                <button
                  data-menuitem
                  onClick={copy}
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-md font-mono text-[12px] text-content-muted transition-colors duration-100 hover:text-content ${FOCUS_RING}`}
                  aria-label={copied ? 'Address copied' : 'Copy your wallet address'}
                >
                  {copied ? (
                    <Check size={12} className="text-brand-green" aria-hidden />
                  ) : (
                    <Copy size={12} aria-hidden />
                  )}
                  {shortAddr(address)}
                </button>
              )}
            </div>

            {/* Your balance */}
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[12px] text-content-muted">Your balance</span>
              <span className="font-mono tnum text-[12px] text-content">
                {balance != null ? `${fmtSol(balance)} SOL` : '-'}
              </span>
            </div>

            <div className="my-1 h-px bg-border" />

            <button
              data-menuitem
              onClick={() => {
                setOpen(false);
                onFund();
              }}
              className={rowCls}
              role="menuitem"
            >
              <ArrowUpRight size={15} className="text-content-muted" aria-hidden />
              Fund the agent
            </button>

            {address && (
              <a
                data-menuitem
                href={accountExplorer(address, cluster)}
                target="_blank"
                rel="noreferrer"
                className={rowCls}
                role="menuitem"
              >
                <ExternalLink size={15} className="text-content-muted" aria-hidden />
                View on explorer
              </a>
            )}

            <div className="my-1 h-px bg-border" />

            <button
              data-menuitem
              onClick={() => {
                setOpen(false);
                onDisconnect();
              }}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-bear transition-colors duration-100 hover:bg-bear/10 ${FOCUS_RING}`}
              role="menuitem"
            >
              <LogOut size={15} aria-hidden />
              Disconnect
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
