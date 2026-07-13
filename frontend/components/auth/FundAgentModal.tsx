'use client';

/**
 * Fund the agent: send SOL from YOUR Privy Solana wallet to the Agent Vault.
 * This is the concrete reason login exists. Sign via Privy, broadcast via a
 * web3.js Connection on the same cluster the vault reports (devnet by default).
 * States per spec 4.4: default / insufficient / signing / broadcasting / success
 * / error+recovery.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { ArrowDown, Check, ExternalLink, Loader2, X } from 'lucide-react';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';
import type { AgentVault } from '@/lib/useAgentWallet';
import { shortAddr } from '@/lib/format';
import { LogoMark } from '../Logo';
import { Identicon } from './Identicon';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
const FEE_BUFFER = 0.01; // Leave a little SOL for fees.
const PRESETS = [0.1, 0.5, 1] as const;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

type Phase = 'default' | 'signing' | 'broadcasting' | 'success' | 'error';
type ErrorKind = 'rejected' | 'failed' | 'timeout';

function fmtSol(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function txExplorer(sig: string, cluster: string): string {
  return `https://solscan.io/tx/${sig}` + (cluster === 'devnet' ? '?cluster=devnet' : '');
}

export function FundAgentModal({
  open,
  onClose,
  vault,
  solanaWallet,
}: {
  open: boolean;
  onClose: () => void;
  vault: AgentVault | null;
  solanaWallet: ConnectedStandardSolanaWallet | null;
}) {
  const { signTransaction } = useSignTransaction();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('default');
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [airdropping, setAirdropping] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const busy = phase === 'signing' || phase === 'broadcasting';
  const cluster = vault?.cluster ?? 'devnet';
  const userAddr = solanaWallet?.address ?? null;

  const loadBalance = useCallback(async () => {
    if (!userAddr) return;
    try {
      const conn = new Connection(RPC, 'confirmed');
      const lamports = await conn.getBalance(new PublicKey(userAddr));
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [userAddr]);

  // Reset + prime on open.
  useEffect(() => {
    if (!open) return;
    setAmount('');
    setPhase('default');
    setErrorKind(null);
    setSignature(null);
    void loadBalance();
    const t = setTimeout(() => amountRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, loadBalance]);

  // Escape closes (blocked mid-broadcast to avoid orphaning a signed tx).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab') trapFocus(e, panelRef.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const amountNum = Number(amount);
  const maxSpend = balance != null ? Math.max(0, balance - FEE_BUFFER) : 0;
  const insufficient =
    balance != null && amountNum > 0 && amountNum > maxSpend;
  const canSend =
    phase === 'default' && amountNum > 0 && balance != null && !insufficient;

  const setMax = () => setAmount(maxSpend > 0 ? String(Number(maxSpend.toFixed(4))) : '0');

  const airdropSelf = async () => {
    if (!userAddr) return;
    setAirdropping(true);
    try {
      const conn = new Connection(RPC, 'confirmed');
      const sig = await conn.requestAirdrop(new PublicKey(userAddr), LAMPORTS_PER_SOL);
      const bh = await conn.getLatestBlockhash();
      await conn.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
      await loadBalance();
    } catch {
      // Faucet rate-limits are expected; the unchanged balance surfaces it.
    } finally {
      setAirdropping(false);
    }
  };

  const send = async () => {
    if (!userAddr || !vault || !solanaWallet) return;
    setErrorKind(null);
    setPhase('signing');

    let signed: Uint8Array;
    let blockhash: string;
    let lastValidBlockHeight: number;
    const conn = new Connection(RPC, 'confirmed');

    // ── Sign ──────────────────────────────────────────────────────────────
    try {
      const fromPubkey = new PublicKey(userAddr);
      const latest = await conn.getLatestBlockhash();
      blockhash = latest.blockhash;
      lastValidBlockHeight = latest.lastValidBlockHeight;

      const tx = new Transaction();
      tx.feePayer = fromPubkey;
      tx.recentBlockhash = blockhash;
      tx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: new PublicKey(vault.address),
          lamports: Math.round(amountNum * LAMPORTS_PER_SOL),
        }),
      );
      const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const res = await signTransaction({
        transaction: new Uint8Array(serialized),
        wallet: solanaWallet,
        chain: `solana:${cluster}` as 'solana:devnet' | 'solana:mainnet' | 'solana:testnet',
      });
      signed = res.signedTransaction;
    } catch {
      setErrorKind('rejected');
      setPhase('error');
      return;
    }

    // ── Broadcast ─────────────────────────────────────────────────────────
    let sig: string;
    setPhase('broadcasting');
    try {
      sig = await conn.sendRawTransaction(signed);
      setSignature(sig);
    } catch {
      setErrorKind('failed');
      setPhase('error');
      return;
    }

    // ── Confirm ───────────────────────────────────────────────────────────
    try {
      await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setPhase('success');
    } catch {
      // Signed and sent, but not confirmed in time: point at the explorer.
      setErrorKind('timeout');
      setPhase('error');
    }
  };

  const backdropClose = () => {
    if (!busy) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 px-4"
      onMouseDown={backdropClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fund the agent"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] animate-fade-up rounded-xl border border-border bg-surface p-6 shadow-panel"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-content">Fund the agent</h2>
            <p className="mt-1 text-[12.5px] text-content-muted">
              Move SOL from your wallet to the Agent Vault so it can trade.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            title={busy ? 'Wait for the transfer to finish' : 'Close'}
            className={`-mr-2 -mt-1 inline-flex h-11 w-11 items-center justify-center rounded-md text-content-muted transition-colors duration-100 hover:text-content disabled:opacity-40 ${FOCUS_RING}`}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {phase === 'success' ? (
          <div className="mt-6 text-center" aria-live="polite">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/12">
              <Check size={22} className="text-brand-green" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium text-content">
              Sent {fmtSol(amountNum)} SOL to the agent.
            </p>
            {signature && (
              <a
                href={txExplorer(signature, cluster)}
                target="_blank"
                rel="noreferrer"
                className={`mt-2 inline-flex items-center gap-1.5 rounded-md font-mono text-[12px] text-content-muted transition-colors duration-100 hover:text-content ${FOCUS_RING}`}
              >
                {shortAddr(signature, 6, 6)}
                <ExternalLink size={12} aria-hidden />
              </a>
            )}
            <button
              onClick={onClose}
              className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-beam text-sm font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px ${FOCUS_RING}`}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* From row */}
            <div className="mt-5 rounded-md border border-border bg-surface-2/60 px-3 py-2.5">
              <div className="text-[11px] text-content-muted">From your wallet</div>
              <div className="mt-1 flex items-center gap-2">
                {userAddr && <Identicon address={userAddr} size={20} />}
                <span className="font-mono text-[13px] text-content">
                  {shortAddr(userAddr)}
                </span>
                <span className="ml-auto font-mono tnum text-[13px] text-content">
                  {balance != null ? `${fmtSol(balance)} SOL` : '-'}
                </span>
              </div>
            </div>

            <div className="my-1.5 flex justify-center">
              <ArrowDown size={16} className="text-content-muted" aria-hidden />
            </div>

            {/* To row - purple hairline reinforces agent ownership */}
            <div className="rounded-md border border-brand-purple/30 bg-surface-2/60 px-3 py-2.5">
              <div className="text-[11px] text-content-muted">To the agent</div>
              <div className="mt-1 flex items-center gap-2">
                <LogoMark size={16} />
                <span className="text-[13px] font-medium text-content">Agent Vault</span>
                <span className="ml-auto font-mono text-[13px] text-content-muted">
                  {shortAddr(vault?.address ?? null)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="mt-4">
              <label
                htmlFor="fund-amount"
                className="block text-[11px] uppercase tracking-wide text-content-muted"
              >
                Amount
              </label>
              <div className="relative mt-1.5">
                <input
                  id="fund-amount"
                  ref={amountRef}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  disabled={busy}
                  inputMode="decimal"
                  placeholder="0.0"
                  aria-invalid={insufficient}
                  className={`h-11 w-full rounded-md border bg-surface-2 pl-3 pr-14 font-mono tnum text-[15px] text-content placeholder:text-content-muted/50 transition-colors duration-100 disabled:opacity-60 ${FOCUS_RING} ${
                    insufficient ? 'border-bear/60' : 'border-border focus-visible:border-brand-purple/50'
                  }`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-content-muted">
                  SOL
                </span>
              </div>

              {/* Presets */}
              <div className="mt-2 flex gap-1.5">
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    disabled={busy}
                    className={`h-8 flex-1 rounded-md border border-border bg-surface-2 font-mono tnum text-[12px] text-content-muted transition-colors duration-100 hover:border-brand-purple/40 hover:text-content disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    {v}
                  </button>
                ))}
                <button
                  onClick={setMax}
                  disabled={busy || balance == null}
                  className={`h-8 flex-1 rounded-md border border-border bg-surface-2 text-[12px] font-medium text-content-muted transition-colors duration-100 hover:border-brand-purple/40 hover:text-content disabled:opacity-50 ${FOCUS_RING}`}
                >
                  Max
                </button>
              </div>

              {insufficient ? (
                <p className="mt-2 text-[12px] text-bear" role="alert">
                  Not enough SOL. You have {balance != null ? fmtSol(balance) : '-'}.
                  {cluster === 'devnet' && (
                    <>
                      {' '}
                      <button
                        onClick={airdropSelf}
                        disabled={airdropping}
                        className={`font-medium text-brand-green underline-offset-2 hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                      >
                        {airdropping ? 'Airdropping...' : 'Airdrop to your wallet'}
                      </button>
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-content-muted">
                  Leaves a little SOL for fees.
                </p>
              )}

              {phase === 'error' && (
                <p className="mt-2 text-[12px] text-bear" role="alert" aria-live="polite">
                  {errorKind === 'rejected' && 'Signature was rejected.'}
                  {errorKind === 'failed' && 'Transfer failed. Nothing was sent.'}
                  {errorKind === 'timeout' && (
                    <>
                      Still pending. {signature ? (
                        <a
                          href={txExplorer(signature, cluster)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          Check the explorer.
                        </a>
                      ) : (
                        'Check the explorer.'
                      )}
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className={`h-11 flex-1 rounded-md border border-border bg-surface-2 text-sm font-medium text-content transition-colors duration-100 hover:border-content/20 disabled:opacity-50 ${FOCUS_RING}`}
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={!canSend && phase !== 'error'}
                aria-busy={busy}
                className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-beam text-sm font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`}
              >
                {phase === 'signing' && (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Confirm in wallet...
                  </>
                )}
                {phase === 'broadcasting' && (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Sending...
                  </>
                )}
                {phase === 'error' && 'Try again'}
                {(phase === 'default') && 'Send to agent'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Minimal focus trap: keep Tab within the panel. */
function trapFocus(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const focusable = panel.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
