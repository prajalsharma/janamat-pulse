import { Router } from 'express';
import { config } from '../config/index.js';
import { agent } from '../agent/agent.js';
import { walletService } from '../services/wallet.js';
import { computePortfolio } from '../services/portfolio.js';
import { recentDecisions, recentNews, recentTrades } from '../db/index.js';
import { decisionDTO } from './dto.js';

export const api = Router();

/** Build the canonical /api/wallet response (a contract other agents depend on). */
async function walletSnapshot() {
  const cluster = config.solana.cluster;
  const address = walletService.publicKey;
  const [solBalance, usdcBalance] = await Promise.all([
    walletService.getSolBalance(),
    walletService.getUsdcBalance(),
  ]);
  const explorerUrl =
    `https://solscan.io/account/${address}` +
    (cluster === 'devnet' ? '?cluster=devnet' : '');
  return {
    address,
    cluster,
    solBalance,
    usdcBalance,
    canAirdrop: cluster === 'devnet',
    explorerUrl,
  };
}

api.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'solvane-backend', ts: Date.now() });
});

api.get('/status', (_req, res) => {
  res.json(agent.status());
});

api.get('/config', (_req, res) => {
  // Non-secret, UI-relevant config so the dashboard can render policy.
  res.json({
    executionMode: config.executionMode,
    cluster: config.solana.cluster,
    aiEnabled: config.ai.enabled,
    aiModel: config.ai.enabled ? config.ai.model : 'heuristic',
    trade: config.trade,
    tickSeconds: config.agent.tickSeconds,
    newsFeeds: config.newsFeeds,
  });
});

api.get('/news', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  res.json(recentNews(limit));
});

api.get('/decisions', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  res.json(recentDecisions(limit));
});

api.get('/trades', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(recentTrades(limit));
});

api.get('/portfolio', async (_req, res, next) => {
  try {
    res.json(await computePortfolio());
  } catch (err) {
    next(err);
  }
});

// ── Wallet ───────────────────────────────────────────────────────────────────
api.get('/wallet', async (_req, res, next) => {
  try {
    res.json(await walletSnapshot());
  } catch (err) {
    next(err);
  }
});

api.post('/wallet/airdrop', async (_req, res, next) => {
  if (config.solana.cluster !== 'devnet') {
    res.status(400).json({ error: 'airdrop only available on devnet' });
    return;
  }
  try {
    await walletService.requestAirdrop(1);
    res.json(await walletSnapshot());
  } catch (err) {
    // Faucet exhaustion/rate-limit is an expected external condition, not a
    // server fault - return 503 with the actionable message.
    res.status(503).json({ error: (err as Error).message });
  }
});

// ── Controls ─────────────────────────────────────────────────────────────────
api.post('/agent/start', (_req, res) => {
  agent.start();
  res.json(agent.status());
});

api.post('/agent/stop', (_req, res) => {
  agent.stop();
  res.json(agent.status());
});

api.post('/agent/tick', async (_req, res, next) => {
  try {
    const decision = await agent.runOnce();
    res.json(decisionDTO(decision)); // flat, consistent with the WS event + snapshot
  } catch (err) {
    next(err);
  }
});
