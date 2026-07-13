import { config } from '../config/index.js';
import { allTrades } from '../db/index.js';
import { priceService } from './price.js';
import { walletService } from './wallet.js';

export interface PortfolioSummary {
  baseSymbol: string;
  baseAmount: number; // net SOL acquired via the agent
  quoteSpent: number; // net USDC spent
  avgEntryUsd: number;
  markPriceUsd: number;
  marketValueUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  totalPnlUsd: number;
  tradeCount: number;
  winRate: number;
  onchainSol: number | null; // real wallet SOL balance (live mode)
}

/**
 * Reconstructs the agent's book from persisted fills using average-cost basis.
 * Works identically for simulated and live fills so the dashboard always shows
 * a coherent P&L view.
 */
export async function computePortfolio(): Promise<PortfolioSummary> {
  const trades = allTrades().filter((t) => t.status !== 'failed');

  let baseAmount = 0; // SOL held
  let costBasis = 0; // USD tied up in current SOL
  let realized = 0;
  let wins = 0;
  let closed = 0;

  for (const t of trades) {
    if (t.action === 'buy') {
      baseAmount += t.outAmount; // SOL received
      costBasis += t.notionalUsd; // USD spent
    } else if (t.action === 'sell') {
      const soldSol = t.inAmount; // SOL disposed
      const avg = baseAmount > 0 ? costBasis / baseAmount : t.priceUsd;
      const proceeds = t.outAmount; // USDC received
      const basisForSold = avg * soldSol;
      const pnl = proceeds - basisForSold;
      realized += pnl;
      closed += 1;
      if (pnl >= 0) wins += 1;
      baseAmount = Math.max(0, baseAmount - soldSol);
      costBasis = Math.max(0, costBasis - basisForSold);
    }
  }

  const mark = (await priceService.getPrice(config.trade.baseMint)).priceUsd;
  const marketValue = baseAmount * mark;
  const avgEntry = baseAmount > 0 ? costBasis / baseAmount : 0;
  const unrealized = marketValue - costBasis;
  // The agent always has a real wallet now, so the on-chain balance is always
  // meaningful (0 until funded/airdropped).
  const onchainSol = await walletService.getSolBalance();

  return {
    baseSymbol: 'SOL',
    baseAmount: Number(baseAmount.toFixed(6)),
    quoteSpent: Number(costBasis.toFixed(2)),
    avgEntryUsd: Number(avgEntry.toFixed(2)),
    markPriceUsd: Number(mark.toFixed(2)),
    marketValueUsd: Number(marketValue.toFixed(2)),
    realizedPnlUsd: Number(realized.toFixed(2)),
    unrealizedPnlUsd: Number(unrealized.toFixed(2)),
    totalPnlUsd: Number((realized + unrealized).toFixed(2)),
    tradeCount: trades.length,
    winRate: closed > 0 ? Number((wins / closed).toFixed(2)) : 0,
    onchainSol,
  };
}
