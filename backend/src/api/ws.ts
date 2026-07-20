import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { bus } from '../agent/bus.js';
import { civicAgent } from '../agent/civic-agent.js';

/**
 * WebSocket fan-out. On connect we send the latest civic pulse snapshot so a
 * fresh browser tab is immediately populated; thereafter we stream every bus
 * event live (civic cycles, ingested news).
 */
export function attachWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    logger.debug('ws client connected');

    const send = (data: unknown) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
    };

    // Initial snapshot: the most recent civic pulse, when a cycle has run.
    const latest = civicAgent.latest;
    if (latest) send({ type: 'civic', payload: latest });

    const unsubscribe = bus.onEvent((event) => send(event));

    socket.on('close', () => {
      unsubscribe();
      logger.debug('ws client disconnected');
    });
    socket.on('error', (err) => logger.debug({ err: err.message }, 'ws error'));
  });

  logger.info('websocket endpoint ready at /ws');
}
