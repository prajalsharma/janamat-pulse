'use client';

import { useState } from 'react';
import { Play, Pause, Zap, Copy, Check, Droplet, Loader2, ExternalLink, Plus } from 'lucide-react';
import type { AgentStatus } from '@/lib/types';
import { shortAddr } from '@/lib/format';
import type { AgentVault, Flash } from '@/lib/useAgentWallet';
import { Logo, LogoMark } from './Logo';
import { Badge, Dot } from './ui';
import { UserWalletMenu } from './auth/UserWalletMenu';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';

type Conn = 'connecting' | 'live' | 'offline';

export interface HeaderAuth {
  configured: boolean;
  authenticated: boolean;
  readOnly: boolean;
  solanaWallet: ConnectedStandardSolanaWallet | null;
  email: string | null;
  cluster: string;
  onSignIn: () => void;
  onDisconnect: () => void;
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

const SIGN_IN_TIP = 'Sign in to fund the agent.';
const CONTROL_TIP = 'Sign in to control the agent.';

function fmtSol(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

/**
 * AGENT VAULT chip: the relabeled, purple-accented former WalletChip. Shows the
 * agent's fundable balance and vault actions, unmistakably the machine's money.
 * Viewing (balance / address / explorer) is always open; funding actions gate on
 * being authenticated.
 */
function AgentVaultChip({
  vault,
  address,
  loading,
  flash,
  refresh,
  canFund,
  onFund,
}: {
  vault: AgentVault | null;
  address: string | null;
  loading: boolean;
  flash: Flash;
  refresh: () => Promise<void>;
  canFund: boolean;
  onFund: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [airdropping, setAirdropping] = useState(false);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const airdrop = async () => {
    setAirdropping(true);
    try {
      await fetch('/api/wallet/airdrop', { method: 'POST' });
      await refresh();
    } catch {
      /* surfaced by unchanged balance */
    } finally {
      setAirdropping(false);
    }
  };

  if (loading && !address) {
    return (
      <span
        className="inline-flex h-9 w-44 animate-pulse rounded-md border border-brand-purple/30 bg-surface-2"
        aria-hidden
      />
    );
  }

  if (!address) {
    return <Badge tone="muted">Vault offline</Badge>;
  }

  const flashTone = flash === 'up' ? 'text-bull' : flash === 'down' ? 'text-bear' : 'text-content';

  return (
    <div className="inline-flex h-9 items-center rounded-md border border-brand-purple/30 bg-surface-2">
      {/* Ownership label - the one earned purple eyebrow (semantic, not decoration) */}
      <span className="flex items-center gap-1.5 pl-2 pr-2.5">
        <LogoMark size={14} />
        <span className="hidden text-[10px] font-medium uppercase tracking-wide text-brand-purple sm:inline">
          Agent Vault
        </span>
      </span>

      <span className="h-4 w-px bg-border" aria-hidden />

      {/* Balance */}
      <span className="flex items-center gap-1.5 px-2.5 text-[11px] font-medium text-content-muted">
        <span className={`font-mono tnum transition-colors duration-300 ${flashTone}`}>
          {vault ? fmtSol(vault.solBalance) : '-'}
        </span>
        <span>SOL</span>
      </span>

      {/* Address - click to copy (hidden on the smallest screens) */}
      <span className="hidden h-full items-center sm:inline-flex">
        <span className="h-4 w-px bg-border" aria-hidden />
        <button
          onClick={copy}
          className={`inline-flex h-full items-center gap-1.5 px-2.5 font-mono text-[11px] text-content-muted transition-colors duration-100 hover:text-content ${FOCUS_RING}`}
          title={copied ? 'Copied' : `Copy ${address}`}
          aria-label={copied ? 'Address copied' : 'Copy vault address'}
        >
          {copied ? (
            <Check size={12} className="text-brand-green" aria-hidden />
          ) : (
            <Copy size={12} aria-hidden />
          )}
          {shortAddr(address)}
        </button>

        {vault?.explorerUrl && (
          <a
            href={vault.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-full items-center pr-2.5 text-content-muted transition-colors duration-100 hover:text-content ${FOCUS_RING}`}
            title="View vault on explorer"
            aria-label="View vault on Solana explorer"
          >
            <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </span>

      <span className="h-4 w-px bg-border" aria-hidden />

      {/* Airdrop (devnet) - funds the agent */}
      {vault?.canAirdrop && (
        <button
          onClick={airdrop}
          disabled={airdropping || !canFund}
          aria-disabled={!canFund}
          aria-busy={airdropping}
          className={`hidden h-full items-center gap-1.5 px-2.5 text-[11px] font-medium text-brand-green transition-colors duration-100 hover:bg-brand-green/10 active:translate-y-px disabled:opacity-50 sm:inline-flex ${
            !canFund ? 'cursor-not-allowed' : ''
          } ${FOCUS_RING}`}
          title={canFund ? 'Request devnet SOL for the agent' : SIGN_IN_TIP}
        >
          {airdropping ? (
            <Loader2 size={12} className="animate-spin" aria-hidden />
          ) : (
            <Droplet size={12} aria-hidden />
          )}
          Airdrop
        </button>
      )}

      {/* Fund the agent - send SOL from your wallet */}
      <button
        onClick={onFund}
        disabled={!canFund}
        aria-disabled={!canFund}
        className={`inline-flex h-full items-center gap-1.5 rounded-r-md px-2.5 text-[11px] font-medium text-brand-purple transition-colors duration-100 hover:bg-brand-purple/10 active:translate-y-px disabled:opacity-50 ${
          !canFund ? 'cursor-not-allowed' : ''
        } ${FOCUS_RING}`}
        title={canFund ? 'Send SOL to the agent vault' : SIGN_IN_TIP}
      >
        <Plus size={12} aria-hidden />
        Fund
      </button>
    </div>
  );
}

export interface VaultBundle {
  vault: AgentVault | null;
  address: string | null;
  loading: boolean;
  flash: Flash;
  refresh: () => Promise<void>;
}

export function Header({
  status,
  conn,
  onControl,
  auth,
  wallet,
  onFund,
}: {
  status: AgentStatus | null;
  conn: Conn;
  onControl: (p: 'start' | 'stop' | 'tick') => void;
  auth: HeaderAuth;
  wallet: VaultBundle;
  onFund: () => void;
}) {
  const running = status?.running ?? false;
  const canOperate = auth.authenticated;

  const connDot: 'live' | 'idle' | 'off' =
    conn === 'live' ? 'live' : conn === 'connecting' ? 'idle' : 'off';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        {/* ── Zone A: brand / stream ─────────────────────────────────────── */}
        <Logo size={38} />
        <div className="flex items-center gap-2 text-xs text-content-muted">
          <Dot tone={connDot} />
          <span className="tnum">
            {conn === 'live'
              ? 'Stream live'
              : conn === 'connecting'
                ? 'Connecting...'
                : 'Reconnecting...'}
          </span>
        </div>

        {/* ── Zone B: the agent (badges + vault + operator controls) ──────── */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {status && (
            <>
              <Badge tone={status.mode === 'live' ? 'bull' : 'warn'}>
                {status.mode === 'live' ? 'LIVE TRADING' : 'DRY-RUN'}
              </Badge>
              <Badge tone="muted" className="hidden sm:inline-flex">
                {status.cluster}
              </Badge>
              <Badge
                tone={status.aiEngine === 'claude' ? 'purple' : 'muted'}
                className="hidden md:inline-flex"
              >
                {status.aiEngine === 'claude' ? 'Claude' : 'Heuristic'}
              </Badge>
            </>
          )}

          <AgentVaultChip
            vault={wallet.vault}
            address={wallet.address}
            loading={wallet.loading}
            flash={wallet.flash}
            refresh={wallet.refresh}
            canFund={canOperate}
            onFund={onFund}
          />

          {/* Operator controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onControl('tick')}
              disabled={!canOperate}
              aria-disabled={!canOperate}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 text-xs font-medium text-content transition-colors duration-100 hover:border-brand-purple/50 hover:text-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-content ${FOCUS_RING}`}
              title={canOperate ? 'Run one evaluation now' : CONTROL_TIP}
            >
              <Zap size={14} aria-hidden /> Tick
            </button>
            <button
              onClick={() => onControl(running ? 'stop' : 'start')}
              disabled={!canOperate}
              aria-disabled={!canOperate}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-xs font-semibold transition-[background,box-shadow,filter,color] duration-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${
                running
                  ? 'border border-border bg-surface-2 text-content hover:text-white'
                  : 'bg-beam text-ink shadow-glow hover:brightness-110'
              }`}
              title={canOperate ? undefined : CONTROL_TIP}
            >
              {running ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
              {running ? 'Pause' : 'Start'}
            </button>
          </div>
        </div>

        {/* Divider between the agent cluster and your identity */}
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />

        {/* ── Zone C: you ────────────────────────────────────────────────── */}
        {auth.authenticated ? (
          <UserWalletMenu
            solanaWallet={auth.solanaWallet}
            email={auth.email}
            cluster={auth.cluster}
            onFund={onFund}
            onDisconnect={auth.onDisconnect}
          />
        ) : auth.configured ? (
          <button
            onClick={auth.onSignIn}
            className={`inline-flex h-9 items-center rounded-md bg-beam px-3.5 text-xs font-semibold text-ink shadow-glow transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px ${FOCUS_RING}`}
          >
            Sign in
          </button>
        ) : null}
      </div>
    </header>
  );
}
