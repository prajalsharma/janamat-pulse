import { EventEmitter } from 'node:events';
import type { AgentEvent } from '../types/index.js';

/**
 * Tiny typed pub/sub. The agent emits; the WebSocket layer subscribes and
 * fans out to browser clients. Decouples the trading core from transport.
 */
class AgentBus extends EventEmitter {
  emitEvent(event: AgentEvent): void {
    this.emit('event', event);
  }
  onEvent(handler: (event: AgentEvent) => void): () => void {
    this.on('event', handler);
    return () => this.off('event', handler);
  }
}

export const bus = new AgentBus();
