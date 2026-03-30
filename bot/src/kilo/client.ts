import http from 'node:http';
import { logger } from '../logger.js';
import type { KiloChatPart, KiloSessionResponse } from './types.js';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeRequest<T>(
  hostname: string,
  port: string,
  path: string,
  method: string,
  body: unknown,
  password: string | undefined,
  signal?: AbortSignal
): Promise<T> {
  const bodyStr = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname,
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          ...(password
            ? { Authorization: `Basic ${Buffer.from(`kilo:${password}`).toString('base64')}` }
            : {}),
        },
        signal,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            if (data === '') {
              resolve({} as T);
            } else {
              resolve(JSON.parse(data) as T);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function checkLocalHealth(
  hostname: string,
  port: string
): Promise<{ healthy: boolean; version: string }> {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname,
        port,
        path: '/global/health',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve({ healthy: true, version: parsed.version || 'local' });
            } catch {
              resolve({ healthy: true, version: 'local' });
            }
          } else {
            resolve({ healthy: false, version: 'local' });
          }
        });
      }
    );
    req.on('error', () => {
      resolve({ healthy: false, version: 'local' });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ healthy: false, version: 'local' });
    });
  });
}

export class KiloClient {
  private readonly hostname: string;
  private readonly port: string;
  private readonly password: string | undefined;

  constructor(apiUrl: string, password?: string) {
    const url = new URL(apiUrl);
    this.hostname = url.hostname;
    this.port = url.port;
    this.password = password;
  }

  async health(): Promise<{ healthy: boolean; version: string }> {
    return checkLocalHealth(this.hostname, this.port);
  }

  async createSession(directory = '/workspace'): Promise<string> {
    const body = { directory };
    const response = await makeRequest<KiloSessionResponse>(
      this.hostname,
      this.port,
      '/session',
      'POST',
      body,
      this.password
    );
    logger.debug('kilo', 'Session created', { sessionId: response.id });
    return response.id;
  }

  async chat(sessionId: string, parts: KiloChatPart[]): Promise<void> {
    const body = { parts };
    await makeRequest(
      this.hostname,
      this.port,
      `/session/${sessionId}/prompt_async?directory=/workspace`,
      'POST',
      body,
      this.password
    );
    logger.debug('kilo', 'Chat sent', { sessionId, parts: parts.length });
  }

  async getLastAssistantMessage(sessionId: string): Promise<string> {
    const messages = await makeRequest<
      Array<{ info: { role: string }; parts: Array<{ type: string; text?: string }> }>
    >(this.hostname, this.port, `/session/${sessionId}/message`, 'GET', {}, this.password);

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.info.role === 'assistant') {
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text) {
            return part.text;
          }
        }
      }
    }
    return '';
  }

  async waitForResponse(sessionId: string): Promise<string> {
    const startTime = Date.now();
    const timeoutMs = 120_000;
    const pollIntervalMs = 2_000;
    const startCount = (await this.getLastAssistantMessage(sessionId)).length;

    while (Date.now() - startTime < timeoutMs) {
      await sleep(pollIntervalMs);
      const response = await this.getLastAssistantMessage(sessionId);
      if (response.length > startCount) {
        return response;
      }
    }

    return '';
  }

  async chatWithMessages(messages: Array<{ role: string; content: string }>): Promise<string> {
    let sessionId: string | null = null;

    try {
      sessionId = await this.createSession('/workspace');

      const parts: KiloChatPart[] = messages.map((m) => ({
        type: 'text',
        text: m.content,
        metadata: { role: m.role as 'user' | 'assistant' | 'system' },
      }));

      await this.chat(sessionId, parts);
      const response = await this.waitForResponse(sessionId);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('kilo', 'Chat failed', { error: error.message, sessionId });
      throw error;
    }
  }

  async abort(sessionId: string): Promise<void> {
    await makeRequest(
      this.hostname,
      this.port,
      `/session/${sessionId}/abort`,
      'POST',
      {},
      this.password
    );
  }
}
