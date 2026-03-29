import https from 'node:https';
import { logger } from '../logger.js';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;
const KILO_CLOUD_API = 'https://api.kilo.ai/api/gateway/v1';
const DEFAULT_MODEL = 'kilo-auto/free';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface KiloMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface KiloCloudResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

async function chatCompletion(
  apiKey: string,
  model: string,
  messages: KiloMessage[],
  signal?: AbortSignal
): Promise<string> {
  const body = JSON.stringify({ model, messages });

  return new Promise((resolve, reject) => {
    const url = new URL(`${KILO_CLOUD_API}/chat/completions`);
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
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
            const parsed = JSON.parse(data) as KiloCloudResponse;
            const content = parsed.choices?.[0]?.message?.content;
            resolve(content ?? '');
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export class KiloClient {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.model = DEFAULT_MODEL;
  }

  async health(): Promise<{ healthy: boolean; version: string }> {
    try {
      await chatCompletion(
        this.apiKey,
        this.model,
        [{ role: 'user', content: 'ping' }],
        AbortSignal.timeout(5000)
      );
      return { healthy: true, version: 'cloud' };
    } catch {
      return { healthy: false, version: 'cloud' };
    }
  }

  async createSession(_directory = '/workspace'): Promise<string> {
    return `session_${Date.now()}`;
  }

  async chat(_sessionId: string, parts: Array<{ type: string; text: string; metadata?: { role?: string } }>): Promise<void> {
    logger.debug('kilo', 'Chat called with parts', { count: parts.length });
  }

  async waitForResponse(_sessionId: string): Promise<string> {
    return '';
  }

  async chatWithMessages(
    messages: KiloMessage[],
    signal?: AbortSignal
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await chatCompletion(this.apiKey, this.model, messages, signal);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_RETRY_DELAY_MS * 2 ** attempt;
          logger.warn('kilo', 'Chat failed, retrying', {
            attempt: attempt + 1,
            delayMs: delay,
            error: lastError.message,
          });
          await sleep(delay);
        }
      }
    }

    throw lastError ?? new Error('Kilo chat failed');
  }

  async abort(_sessionId: string): Promise<void> {
    // No-op for cloud API
  }
}

export interface KiloChatPart {
  type: 'text';
  text: string;
  metadata?: { role?: string };
}

export interface KiloHealthResponse {
  healthy: boolean;
  version: string;
}

export interface KiloSSEEvent {
  type?: string;
  content?: string;
  sessionID?: string;
}

export interface KiloSessionResponse {
  id: string;
}
