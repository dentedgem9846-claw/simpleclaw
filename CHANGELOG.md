# Changelog

All notable changes to SimpleClaw will be documented in this file.

## [2.0.0] — 2026-03-30

### Added

- **SimpleX Chat Integration** — Bot connects via SimpleX for encrypted, serverless messaging
- **Local Kilo AI** — Runs Kilo agent locally via Docker (no cloud AI required)
- **Auto Contact Acceptance** — Bot automatically accepts connection requests
- **Session-based Conversations** — Each user gets a separate Kilo session
- **Health Endpoints** — Bot exposes `/health` endpoint for monitoring
- **Comprehensive Documentation** — Setup guide, architecture docs, troubleshooting workflow
- **Agent Web Capabilities** — `webfetch` and `browser` permissions for internet access

### Changed

- **Complete Rewrite** — Moved from CLI-based interaction to SimpleX Chat bot
- **Docker-first Architecture** — All services run as Docker containers
- **New Kilo Client** — Local HTTP client using session-based API (`/session`, `/prompt_async`, `/message`)

### Architecture

```
simpleclaw-bot-1      → SimpleX Chat bot (receives messages via WebSocket)
simpleclaw-simplex-1 → SimpleX Chat server (WebSocket relay)
simpleclaw-kilo-1    → Local Kilo AI agent (session-based HTTP API)
```

### Kilo API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session` | POST | Create new session (returns JSON with `id`) |
| `/session/{id}/prompt_async` | POST | Send prompt (returns 204 empty) |
| `/session/{id}/message` | GET | Get messages (polls for response) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SIMPLEX_WS_URL` | `ws://simpleclaw-simplex-1:5225` | SimpleX WebSocket |
| `KILO_API_URL` | `http://simpleclaw-kilo-1:4096` | Local Kilo API |
| `KILO_PASSWORD` | - | Optional Kilo password |
| `KILO_API_KEY` | - | Optional cloud API key |

### Requirements

- Linux x86_64 host with Docker and Docker Compose v2+
- SimpleX Chat app for messaging
- Optional: Kilo API key for enhanced AI (can run free tier)

---

## [1.0.0] — 2026-03-29

### Added

- **Simplex CLI Chat bridge** — Node.js bot connecting SimpleX encrypted messaging to Kilo AI
- **3-container Docker Compose deployment** — `simplex-chat`, `kilo`, and `simpleclaw-bot` containers
- **SimplexWsClient** — WebSocket client with exponential backoff reconnection
- **KiloClient** — HTTP + SSE client with retry logic
- **SessionManager** — per-contact Kilo AI session tracking
- **MemoryStore** — SQLite conversation persistence
- **MessageLoop** — full receive → context → Kilo → respond pipeline
- **Contact request handling** — automatic accept of incoming SimpleX contact requests
- **Structured JSON logging** — all output is JSON with `ts`, `level`, `module`, `msg` fields
- **Health check endpoint** — `GET /health` on port 8080
- **Graceful shutdown** — SIGTERM/SIGINT handled cleanly
- **Rate limiting** — max 10 messages per contact per 60-second window
- **User commands** — `/help` and `/status` handled in-bot
- **Biome** — configured as formatter and linter
- **`precommit` script** — lint, typecheck, test
