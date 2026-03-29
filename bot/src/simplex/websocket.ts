import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { logger } from '../logger.js';
import { decodeMessage, encodeCommand, generateCorrId } from './protocol.js';
import type { ParsedMessage, SimplexEvent, SimplexResponse } from './types.js';

type ResponseHandler = (resp: SimplexResponse) => void;
type EventHandler = (event: SimplexEvent) => void;

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1_000;

export class SimplexWsClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private pendingResponses: Map<string, ResponseHandler> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private closed = false;

  constructor(url: string) {
    super();
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.once('open', () => {
        this.reconnectAttempts = 0;
        logger.info('simplex', 'Connected', { url: this.url });
        resolve();
      });

      this.ws.once('error', (err) => {
        reject(err);
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        const raw = data.toString();
        const msg = decodeMessage(raw);
        if (!msg) {
          logger.warn('simplex', 'Failed to decode message', { raw: raw.slice(0, 200) });
          return;
        }

        if (msg.corrId && this.pendingResponses.has(msg.corrId)) {
          const handler = this.pendingResponses.get(msg.corrId);
          this.pendingResponses.delete(msg.corrId);
          handler?.(msg.resp as SimplexResponse);
        } else {
          this.emit('event', msg.resp as SimplexEvent);
        }
      });

      this.ws.on('close', () => {
        if (!this.closed) {
          logger.warn('simplex', 'WebSocket closed, scheduling reconnect');
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (err) => {
        logger.error('simplex', 'WebSocket error', { error: err.message });
      });
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('simplex', 'Max reconnection attempts reached, exiting', {
        attempts: this.reconnectAttempts,
      });
      process.exit(1);
    }

    const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectAttempts++;

    logger.info('simplex', 'Reconnecting', {
      attempt: this.reconnectAttempts,
      delayMs: delay,
    });

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
        logger.info('simplex', 'Reconnected successfully');
        this.emit('reconnect');
      } catch (err) {
        logger.error('simplex', 'Reconnect failed', {
          error: err instanceof Error ? err.message : String(err),
        });
        this.scheduleReconnect();
      }
    }, delay);
  }

  sendCommand(cmd: string): Promise<SimplexResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'));
      }

      const corrId = generateCorrId();
      const message = encodeCommand(corrId, cmd);

      this.pendingResponses.set(corrId, resolve);

      const timeout = setTimeout(() => {
        this.pendingResponses.delete(corrId);
        reject(new Error(`Command timed out: ${cmd}`));
      }, 30_000);

      const originalHandler = this.pendingResponses.get(corrId);
      if (originalHandler) {
        this.pendingResponses.set(corrId, (resp) => {
          clearTimeout(timeout);
          originalHandler(resp);
        });
      }

      this.ws.send(message, (err) => {
        if (err) {
          clearTimeout(timeout);
          this.pendingResponses.delete(corrId);
          reject(err);
        }
      });
    });
  }

  onEvent(handler: EventHandler): void {
    this.on('event', handler);
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
