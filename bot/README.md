# SimpleClaw Bot — SimpleX Chat Bridge

A Node.js service that connects [SimpleX](https://simplex.chat) encrypted messaging to
[Kilo Code AI](https://kilo.ai), enabling private AI conversations over the SimpleX network with
no phone number or account required.

## Architecture

```
User (SimpleX App)
    |
    | SimpleX Network (E2E encrypted, double-ratchet, TLS 1.3)
    |
    v
[simplex-chat]  <-- WebSocket :5225 -->  [simpleclaw-bot]
                                               |
                                               | HTTP :4096
                                               v
                                          [kilo serve]
```

Three containers are orchestrated via Docker Compose:

| Container | Image base | Role |
|---|---|---|
| `simplex-chat-1` | `debian:stable-slim` + simplex-chat binary | SimpleX protocol engine |
| `kilo-1` | `debian:stable-slim` + Node.js 20 + `@kilocode/cli` | Kilo AI HTTP server |
| `simpleclaw-bot-1` | `debian:stable-slim` + Node.js 20 | Bot orchestrator |

## Prerequisites

- Linux x86_64 host with Docker and Docker Compose
- LLM API key (Anthropic or other supported provider)
- SimpleX Chat app ([mobile](https://simplex.chat/downloads/) or [desktop](https://github.com/simplex-chat/simplex-chat/releases)) for testing

## Quick Start

```bash
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY at minimum
docker-compose up -d
docker-compose logs -f simpleclaw-bot-1   # watch for bot address
```

Paste the logged SimpleX address into your SimpleX app to connect.

## Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and edit:

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | LLM provider API key |
| `KILO_PASSWORD` | No | — | Kilo HTTP API Basic Auth password |
| `SIMPLEX_WS_URL` | No | `ws://simplex-chat-1:5225` | simplex-chat WebSocket URL |
| `KILO_API_URL` | No | `http://kilo-1:4096` | Kilo HTTP API base URL |
| `BOT_DATA_DIR` | No | `/app/data` | Bot writable data directory (SQLite) |
| `LOG_LEVEL` | No | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |

## Bot Commands

Users can send these commands to the bot via SimpleX DM:

| Command | Description |
|---|---|
| `/help` | Show available commands |
| `/status` | Check bot status |

Any other message is forwarded to the Kilo AI agent and a response is returned.

## Source Layout

```
bot/
  src/
    index.ts              Entry point, health server, graceful shutdown
    logger.ts             Structured JSON logger
    loop.ts               MessageLoop: receive → context → Kilo → respond
    simplex/
      websocket.ts        SimplexWsClient (WebSocket, reconnect with backoff)
      protocol.ts         Encode/decode SimpleX commands
      types.ts            TypeScript types for SimpleX events
    kilo/
      client.ts           KiloClient (HTTP + SSE, retry logic)
      session.ts          SessionManager (per-contact Kilo sessions)
      types.ts            TypeScript types for Kilo API
    memory/
      store.ts            MemoryStore (better-sqlite3 CRUD)
      schema.ts           SQLite schema SQL
```

## Development

```bash
npm install
npm run dev          # run with tsx (no compile step)
npm test             # run unit tests (vitest)
npm run test:coverage  # with coverage report
npm run precommit    # lint + type-check + tests
npm run build        # compile to dist/
```

## Logging

All log output is structured JSON, one entry per line:

```json
{"ts":"2026-03-29T12:00:00.000Z","level":"info","module":"main","msg":"Bot is ready"}
{"ts":"2026-03-29T12:00:01.000Z","level":"info","module":"loop","msg":"Incoming message","contactId":42,"preview":"hello"}
```

Stream live logs:

```bash
docker-compose logs -f simpleclaw-bot-1
```

## Health Check

The bot exposes `GET /health` on port 8080:

```bash
curl http://localhost:8080/health
# {"healthy":true}
```

Returns `200` when ready, `503` during startup or shutdown.

## Volumes

| Volume | Mount in container | Purpose |
|---|---|---|
| `simplex-data-1` | `/data` | simplex-chat databases (chat.db, agent.db) |
| `kilo-data-1` | `/root/.local/share/kilo/sessions` | Kilo session state |
| `bot-data-1` | `/app/data` | Bot SQLite database (bot.db) |
| `./data` (RO) | `/workspace/data` | Zettelkasten notes |
| `./core` (RO) | `/workspace/core` | CLAW.md, USER.md |
| `./.kilo/agents` (RO) | `/workspace/.kilo/agents` | Agent configurations |

## Stopping

```bash
docker-compose down        # stop containers, preserve volumes
docker-compose down -v     # stop and destroy volumes (data loss!)
```

## Backup

Back up the SQLite database before upgrades:

```bash
docker cp simpleclaw-bot-1:/app/data/bot.db ./backups/bot-$(date +%Y%m%d).db
```
