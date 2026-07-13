import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { bus } from '../agent/bus.js';
import { agent } from '../agent/agent.js';
import { recentDecisions, recentNews, recentTrades } from '../db/index.js';

/**
 * WebSocket fan-out. On connect we send a snapshot so a fresh browser tab is
 * immediately populated; thereafter we stream every bus event live.
 */
export function attachWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    logger.debug('ws client connected');

    const send = (data: unknown) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
    };

    // Initial snapshot.
    send({ type: 'status', payload: agent.status() });
    send({ type: 'snapshot', payload: {
      news: recentNews(30),
      decisions: recentDecisions(30),
      trades: recentTrades(50),
    }});

    const unsubscribe = bus.onEvent((event) => send(event));

    socket.on('close', () => {
      unsubscribe();
      logger.debug('ws client disconnected');
    });
    socket.on('error', (err) => logger.debug({ err: err.message }, 'ws error'));
  });

  logger.info('websocket endpoint ready at /ws');
}
