import http from 'node:http';
import https from 'node:https';
import { logger } from '../logger.js';
import type {
  KiloChatPart,
  KiloHealthResponse,
  KiloSSEEvent,
  KiloSessionResponse,
} from './types.js';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

function parseAuthHeader(password?: string): Record<string, string> {
  if (!password) return {};
  const encoded = Buffer.from(`kilo:${password}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rawRequest(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const bodyStr = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (bodyStr) {
      reqHeaders['Content-Length'] = String(Buffer.byteLength(bodyStr));
    }

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function requestWithRetry(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
  retries = MAX_RETRIES
): Promise<{ status: number; body: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await rawRequest(method, url, body, headers);

      // 401 is a fatal auth error — do not retry
      if (resp.status === 401) {
        throw new Error('Kilo auth failure (401): check KILO_PASSWORD');
      }

      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }

      lastError = new Error(`HTTP ${resp.status}: ${resp.body}`);
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.message.includes('auth failure')) {
        throw err;
      }
    }

    if (attempt < retries - 1) {
      const delay = BASE_RETRY_DELAY_MS * 2 ** attempt;
      logger.warn('kilo', 'Request failed, retrying', {
        attempt: attempt + 1,
        delayMs: delay,
        url,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      });
      await sleep(delay);
    }
  }

  throw lastError;
}

export class KiloClient {
  private readonly baseUrl: string;
  private readonly authHeaders: Record<string, string>;

  constructor(baseUrl: string, password?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authHeaders = parseAuthHeader(password);
  }

  async health(): Promise<KiloHealthResponse> {
    const resp = await rawRequest(
      'GET',
      `${this.baseUrl}/global/health`,
      undefined,
      this.authHeaders
    );
    return JSON.parse(resp.body) as KiloHealthResponse;
  }

  async createSession(directory = '/workspace'): Promise<string> {
    const resp = await requestWithRetry(
      'POST',
      `${this.baseUrl}/session`,
      { directory },
      this.authHeaders
    );
    const data = JSON.parse(resp.body) as KiloSessionResponse;
    return data.id;
  }

  async chat(sessionId: string, parts: KiloChatPart[]): Promise<void> {
    await requestWithRetry(
      'POST',
      `${this.baseUrl}/session/${sessionId}/chat`,
      { parts },
      this.authHeaders
    );
  }

  /**
   * Open SSE stream. Calls onEvent for each parsed event.
   * Returns an abort function to close the stream.
   */
  streamEvents(
    sessionId: string,
    onEvent: (event: KiloSSEEvent) => void,
    onError?: (err: Error) => void
  ): () => void {
    const url = new URL(`${this.baseUrl}/event`);
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...this.authHeaders,
        },
      },
      (res) => {
        let buffer = '';

        res.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let eventType = '';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLine = line.slice(5).trim();
            } else if (line === '') {
              if (dataLine) {
                try {
                  const parsed = JSON.parse(dataLine) as KiloSSEEvent;
                  // Filter to this session client-side (SSE may broadcast all sessions)
                  if (!parsed.sessionID || parsed.sessionID === sessionId) {
                    if (eventType) {
                      parsed.type = eventType;
                    }
                    onEvent(parsed);
                  }
                } catch {
                  logger.warn('kilo', 'Failed to parse SSE event', {
                    raw: dataLine.slice(0, 200),
                  });
                }
              }
              eventType = '';
              dataLine = '';
            }
          }
        });

        res.on('error', (err) => {
          onError?.(err);
        });
      }
    );

    req.on('error', (err) => {
      onError?.(err);
    });

    req.end();

    return () => req.destroy();
  }

  /**
   * Wait for a complete turn response from Kilo. Returns accumulated text.
   */
  waitForResponse(sessionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let accumulated = '';

      const close = this.streamEvents(
        sessionId,
        (event) => {
          if (event.type === 'text') {
            accumulated += (event as { content?: string }).content ?? '';
          } else if (event.type === 'turn_end') {
            close();
            resolve(accumulated);
          }
        },
        (err) => {
          close();
          reject(err);
        }
      );
    });
  }

  async abort(sessionId: string): Promise<void> {
    await rawRequest(
      'POST',
      `${this.baseUrl}/session/${sessionId}/abort`,
      undefined,
      this.authHeaders
    );
  }
}
