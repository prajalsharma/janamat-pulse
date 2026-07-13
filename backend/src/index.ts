import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { api } from './api/rest.js';
import { attachWebSocket } from './api/ws.js';
import { agent } from './agent/agent.js';
import { walletService } from './services/wallet.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', api);

// Central error handler so route failures return clean JSON.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err: err.message }, 'request failed');
  res.status(500).json({ error: err.message });
});

const server = http.createServer(app);
attachWebSocket(server);

server.listen(config.port, () => {
  logger.info('');
  logger.info('  ███████╗ ██████╗ ██╗    ██╗   ██╗ █████╗ ███╗   ██╗███████╗');
  logger.info('  SolVane - news-sentiment trading agent for Solana');
  logger.info('  ───────────────────────────────────────────────────────────');
  logger.info(`  API      →  http://localhost:${config.port}/api`);
  logger.info(`  WS       →  ws://localhost:${config.port}/ws`);
  logger.info(`  Mode     →  ${config.executionMode.toUpperCase()}   (${config.solana.cluster})`);
  logger.info(`  AI       →  ${config.ai.enabled ? config.ai.model : 'heuristic (no API key)'}`);
  logger.info(`  Wallet   →  ${walletService.publicKey}${config.solana.hasWallet ? '' : ' (auto-generated)'}`);
  logger.info('  ───────────────────────────────────────────────────────────');
  // Auto-start the trading loop.
  agent.start();
});

const shutdown = (sig: string) => {
  logger.info({ sig }, 'shutting down');
  agent.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
