import { VersionedTransaction } from '@solana/web3.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { stableId } from '../utils/hash.js';
import { walletService } from './wallet.js';
import type { TradeAction, TradeDecision, TradeRecord } from '../types/index.js';

// Jupiter's current keyless (free-tier) Swap API. Set JUP_API_BASE to
// https://api.jup.ag if you hold a paid Jupiter API key.
const JUP_BASE = process.env.JUP_API_BASE || 'https://lite-api.jup.ag';
const JUP_QUOTE = `${JUP_BASE}/swap/v1/quote`;
const JUP_SWAP = `${JUP_BASE}/swap/v1/swap`;

// Minimal decimals table for the tokens this MVP trades.
const DECIMALS: Record<string, number> = {
  So11111111111111111111111111111111111111112: 9, // SOL
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 6, // USDC
};

function toBaseUnits(amount: number, mint: string): number {
  return Math.round(amount * 10 ** (DECIMALS[mint] ?? 9));
}
function fromBaseUnits(amount: number | string, mint: string): number {
  return Number(amount) / 10 ** (DECIMALS[mint] ?? 9);
}

interface JupQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: { swapInfo: { label: string } }[];
  [k: string]: unknown;
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 12_000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${body.slice(0, 160)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export class ExecutorService {
  /** Resolve the (inputMint, outputMint, inAmount) for a given action + notional. */
  private legFor(action: TradeAction, notionalUsd: number, priceUsd: number) {
    const { quoteMint, baseMint } = config.trade;
    if (action === 'buy') {
      // Spend USDC (quote) to acquire SOL (base).
      return { inputMint: quoteMint, outputMint: baseMint, inAmountHuman: notionalUsd };
    }
    // sell: dispose SOL (base) worth notionalUsd back to USDC (quote).
    const solAmount = priceUsd > 0 ? notionalUsd / priceUsd : 0;
    return { inputMint: baseMint, outputMint: quoteMint, inAmountHuman: solAmount };
  }

  async getQuote(action: TradeAction, notionalUsd: number, priceUsd: number): Promise<JupQuote> {
    const { inputMint, outputMint, inAmountHuman } = this.legFor(action, notionalUsd, priceUsd);
    const amount = toBaseUnits(inAmountHuman, inputMint);
    const url =
      `${JUP_QUOTE}?inputMint=${inputMint}&outputMint=${outputMint}` +
      `&amount=${amount}&slippageBps=${config.trade.maxSlippageBps}&restrictIntermediateTokens=true`;
    return (await fetchJson(url)) as JupQuote;
  }

  private routeLabel(quote: JupQuote): string {
    const labels = (quote.routePlan ?? []).map((r) => r.swapInfo?.label).filter(Boolean);
    return labels.length ? Array.from(new Set(labels)).join(' → ') : 'Jupiter';
  }

  /**
   * Execute a decision. In dry-run we fetch a real quote and record a simulated
   * fill. In live mode we build, sign and broadcast the Jupiter swap tx.
   */
  async execute(decision: TradeDecision): Promise<TradeRecord> {
    const action = decision.action;
    const priceUsd = decision.price?.priceUsd ?? 0;
    const base: Omit<TradeRecord, 'status' | 'signature' | 'error' | 'outAmount' | 'routeLabel'> & {
      routeLabel: string;
    } = {
      id: stableId('trade', decision.id, Date.now()),
      decisionId: decision.id,
      at: Date.now(),
      action,
      mode: config.executionMode,
      inputMint: '',
      outputMint: '',
      inAmount: 0,
      priceUsd,
      notionalUsd: decision.notionalUsd,
      slippageBps: config.trade.maxSlippageBps,
      routeLabel: 'Jupiter',
    };

    try {
      const quote = await this.getQuote(action, decision.notionalUsd, priceUsd);
      base.inputMint = quote.inputMint;
      base.outputMint = quote.outputMint;
      base.inAmount = fromBaseUnits(quote.inAmount, quote.inputMint);
      const outAmount = fromBaseUnits(quote.outAmount, quote.outputMint);
      base.routeLabel = this.routeLabel(quote);

      // ── Dry run ────────────────────────────────────────────────────────────
      if (config.executionMode === 'dry-run') {
        logger.info(
          { action, route: base.routeLabel, in: base.inAmount, out: outAmount },
          'simulated swap (dry-run)',
        );
        return { ...base, outAmount, status: 'simulated', signature: null, error: null };
      }

      // ── Live swap ────────────────────────────────────────────────────────────
      const swapResp = await fetchJson(JUP_SWAP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: walletService.publicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      const txBuf = Buffer.from(swapResp.swapTransaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuf);
      tx.sign([walletService.signer]);

      const sig = await walletService.connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      logger.info({ sig }, 'swap submitted, confirming…');

      const conf = await walletService.connection.confirmTransaction(sig, 'confirmed');
      const status = conf.value.err ? 'failed' : 'confirmed';
      return {
        ...base,
        outAmount,
        status,
        signature: sig,
        error: conf.value.err ? JSON.stringify(conf.value.err) : null,
      };
    } catch (err) {
      const message = (err as Error).message;
      logger.error({ err: message }, 'trade execution failed');
      return {
        ...base,
        outAmount: 0,
        status: 'failed',
        signature: null,
        error: message,
      };
    }
  }
}

export const executorService = new ExecutorService();
