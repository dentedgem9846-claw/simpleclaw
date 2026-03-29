import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { KiloClient } from './kilo/client.js';
import { SessionManager } from './kilo/session.js';
import { logger } from './logger.js';
import { MessageLoop } from './loop.js';
import { MemoryStore } from './memory/store.js';
import type { UserContactLinkCreatedResponse, UserContactLinkResponse } from './simplex/types.js';
import { SimplexWsClient } from './simplex/websocket.js';

const SIMPLEX_WS_URL = process.env.SIMPLEX_WS_URL ?? 'ws://localhost:5225';
const KILO_API_KEY = process.env.KILO_API_KEY ?? '';
const BOT_DATA_DIR = process.env.BOT_DATA_DIR ?? '/app/data';
const HEALTH_PORT = 8080;

const DB_PATH = path.join(BOT_DATA_DIR, 'bot.db');

let isReady = false;

// ---------------------------------------------------------------------------
// Health check server
// ---------------------------------------------------------------------------

function startHealthServer(): void {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const status = isReady ? 200 : 503;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ healthy: isReady }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(HEALTH_PORT, () => {
    logger.info('health', 'Health server listening', { port: HEALTH_PORT });
  });
}

// ---------------------------------------------------------------------------
// First-run setup: create bot profile and address if needed
// ---------------------------------------------------------------------------

async function firstRunSetup(simplex: SimplexWsClient): Promise<void> {
  logger.info('setup', 'Checking bot address');

  const userId = 1;

  try {
    const showResp = await simplex.sendCommand(`/_show_address ${userId}`);

    if (showResp.type === 'userContactLink') {
      const link = (showResp as UserContactLinkResponse).contactLink?.connLinkContact?.connLink;
      logger.info('setup', 'Bot address already exists', { link: link ?? '(unavailable)' });
      return;
    }
  } catch {
    // No address yet — fall through to create
  }

  logger.info('setup', 'Creating bot address');
  const createResp = await simplex.sendCommand(`/_address ${userId}`);

  if (createResp.type === 'userContactLinkCreated') {
    const link = (createResp as UserContactLinkCreatedResponse).connLinkContact?.connLink;
    logger.info('setup', 'Bot address created', { link });
  }

  const settings = JSON.stringify({ autoAccept: true });
  await simplex.sendCommand(`/_address_settings ${userId} ${settings}`);
  logger.info('setup', 'Auto-accept enabled');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  logger.info('main', 'SimpleClaw bot starting');

  startHealthServer();

  const memory = new MemoryStore(DB_PATH);
  const kilo = new KiloClient(KILO_API_KEY);
  const sessions = new SessionManager(kilo);
  const simplex = new SimplexWsClient(SIMPLEX_WS_URL);

  logger.info('main', 'Connecting to SimpleX', { url: SIMPLEX_WS_URL });
  await simplex.connect();

  await simplex.sendCommand('/start').catch((err) => {
    logger.warn('main', 'Chat start warning', { error: err.message });
  });
  logger.info('main', 'Chat controller started');

  await firstRunSetup(simplex);

  await firstRunSetup(simplex);

  logger.info('main', 'Checking Kilo health');
  const health = await kilo.health();
  logger.info('main', 'Kilo healthy', { version: health.version });

  const loop = new MessageLoop(simplex, kilo, sessions, memory);
  loop.start();

  isReady = true;
  logger.info('main', 'Bot is ready');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('main', 'Shutting down', { signal });
    isReady = false;
    await simplex.close();
    memory.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  logger.error('main', 'Fatal error', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
