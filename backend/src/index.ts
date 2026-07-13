import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { civicApi } from './api/civic-rest.js';
import { attachWebSocket } from './api/ws.js';
import { civicAgent } from './agent/civic-agent.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', civicApi); // Janamat Pulse civic API

// Central error handler so route failures return clean JSON.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err: err.message }, 'request failed');
  res.status(500).json({ error: err.message });
});

const server = http.createServer(app);
attachWebSocket(server);

server.listen(config.port, () => {
  logger.info('');
  logger.info('  Janamat Pulse - agentic civic-accountability layer for Solana');
  logger.info('  ───────────────────────────────────────────────────────────');
  logger.info(`  API      →  http://localhost:${config.port}/api/civic`);
  logger.info(`  WS       →  ws://localhost:${config.port}/ws`);
  logger.info(`  Cluster  →  ${config.solana.cluster}`);
  logger.info(`  AI       →  ${config.ai.enabled ? config.ai.model : 'heuristic (no API key)'}`);
  logger.info(`  On-chain →  ${config.onchain.enabled ? config.onchain.programId : 'off (off-chain mode)'}`);
  logger.info('  ───────────────────────────────────────────────────────────');
  // Auto-start the civic accountability loop.
  civicAgent.start();
});

const shutdown = (sig: string) => {
  logger.info({ sig }, 'shutting down');
  civicAgent.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
