'use client';

/**
 * The trading terminal: the existing dashboard, unchanged in its data flow. It now
 * receives an auth bundle so the header can gate operator controls and funding.
 * Viewing everything here is public/keyless; only Start/Pause/Tick + funding gate
 * on being authenticated.
 */

import { useEffect, useState } from 'react';
import { Newspaper, BrainCircuit, ShieldCheck, Repeat } from 'lucide-react';
import { useAgentStream } from '@/lib/useAgentStream';
import { useAgentWallet } from '@/lib/useAgentWallet';
import { Header, type HeaderAuth } from './Header';
import { ReadOnlyBanner } from './auth/ReadOnlyBanner';
import { FundAgentModal } from './auth/FundAgentModal';
import { SentimentGauge } from './SentimentGauge';
import { PricePanel } from './PricePanel';
import { PortfolioPanel } from './PortfolioPanel';
import { DecisionFeed } from './DecisionFeed';
import { TradeBlotter } from './TradeBlotter';
import { NewsFeed } from './NewsFeed';

const PIPELINE = [
  { icon: Newspaper, label: 'Ingest news', hint: 'Live RSS + X' },
  { icon: BrainCircuit, label: 'Score sentiment', hint: 'Claude / lexical' },
  { icon: ShieldCheck, label: 'Risk-gate', hint: 'Conf · move · caps' },
  { icon: Repeat, label: 'Route swap', hint: 'Jupiter' },
];

export function Terminal({ auth }: { auth: HeaderAuth }) {
  const s = useAgentStream();
  const wallet = useAgentWallet(s.status?.wallet ?? null);
  const [countdown, setCountdown] = useState('paused');
  const [fundOpen, setFundOpen] = useState(false);

  // Live "next tick" countdown, ticking every second.
  useEffect(() => {
    const id = setInterval(() => {
      const next = s.status?.nextTickAt;
      if (!next || !s.status?.running) return setCountdown(s.status?.running ? '...' : 'paused');
      const secs = Math.max(0, Math.round((next - Date.now()) / 1000));
      setCountdown(`${secs}s`);
    }, 500);
    return () => clearInterval(id);
  }, [s.status]);

  const openFund = () => {
    if (auth.authenticated) setFundOpen(true);
  };

  // Refine the cluster from the live vault snapshot (drives your-wallet explorer links).
  const headerAuth: HeaderAuth = { ...auth, cluster: wallet.vault?.cluster ?? auth.cluster };

  return (
    <div className="min-h-screen">
      <Header
        status={s.status}
        conn={s.conn}
        onControl={s.control}
        auth={headerAuth}
        wallet={wallet}
        onFund={openFund}
      />

      {auth.readOnly && (
        <ReadOnlyBanner configured={auth.configured} onSignIn={auth.onSignIn} />
      )}

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {/* Pipeline strip */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3">
          <span className="text-[11px] uppercase tracking-wide text-content-muted">Pipeline</span>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {PIPELINE.map((p, i) => (
              <div key={p.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-1.5">
                  <p.icon size={14} className="text-brand-purple" />
                  <div className="leading-tight">
                    <div className="text-xs font-medium text-content">{p.label}</div>
                    <div className="text-[10px] text-content-muted">{p.hint}</div>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && <span className="text-content-muted/40">→</span>}
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-content-muted">
            <span>next tick</span>
            <span className="rounded-md bg-surface-2 px-2 py-1 font-mono tnum text-content">
              {countdown}
            </span>
          </div>
        </div>

        {/* Top row: sentiment · price · portfolio */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <SentimentGauge sentiment={s.sentiment} />
          <PricePanel price={s.price} history={s.prices} />
          <PortfolioPanel p={s.portfolio} />
        </div>

        {/* Middle row: decisions · trades */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DecisionFeed decisions={s.decisions} />
          <TradeBlotter trades={s.trades} />
        </div>

        {/* News */}
        <div className="mt-5">
          <NewsFeed news={s.news} />
        </div>

        <footer className="mt-8 border-t border-border pt-5 text-center text-xs text-content-muted">
          <p>
            SolVane · autonomous news-sentiment trading on Solana ·{' '}
            <span className="text-warn">
              {s.status?.mode === 'live' ? 'LIVE: real funds at risk' : 'dry-run: no funds move'}
            </span>
          </p>
          <p className="mt-1">Swaps routed via Jupiter. Demo instrument, not financial advice.</p>
        </footer>
      </main>

      {auth.configured && (
        <FundAgentModal
          open={fundOpen}
          onClose={() => setFundOpen(false)}
          vault={wallet.vault}
          solanaWallet={auth.solanaWallet}
        />
      )}
    </div>
  );
}
