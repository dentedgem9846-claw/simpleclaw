# Changelog

## [2.0.0] — 2026-03-29

### Added

- **Simplex CLI Chat bridge** — Node.js bot connecting SimpleX encrypted messaging to Kilo AI
- **3-container Docker Compose deployment** — `simplex-chat`, `kilo`, and `simpleclaw-bot` containers
- **SimplexWsClient** — WebSocket client with exponential backoff reconnection (max 5 attempts)
- **KiloClient** — HTTP + SSE client with 3-retry logic and exponential backoff
- **SessionManager** — per-contact Kilo AI session tracking (one session per SimpleX contact)
- **MemoryStore** — SQLite conversation persistence via `better-sqlite3` (WAL mode)
- **MessageLoop** — full receive → context → Kilo → respond pipeline
- **Contact request handling** — automatic accept of incoming SimpleX contact requests
- **Bot profile first-run setup** — address creation and auto-accept on first start
- **Structured JSON logging** — all output is JSON with `ts`, `level`, `module`, `msg` fields
- **Health check endpoint** — `GET /health` on port 8080, 200 when ready / 503 during startup
- **Graceful shutdown** — SIGTERM/SIGINT handled cleanly (close WebSocket, flush SQLite)
- **Rate limiting** — max 10 messages per contact per 60-second window
- **Message truncation** — responses and stored messages capped at 4096 characters
- **User commands** — `/help` and `/status` handled in-bot without calling Kilo
- **Biome** — configured as formatter and linter (`biome.json`)
- **Vitest** — unit test suite (45 tests across all modules)
- **`precommit` script** — `biome check --write src && tsc --noEmit && vitest run`

### Architecture

```
simplex-chat (WebSocket :5225) <--> simpleclaw-bot (Node.js) <--> kilo serve (HTTP :4096)
```

### Breaking Changes

- None. SimpleClaw 1.0 local agent system is unchanged; the 2.0 bot is additive.

### Requirements

- Linux x86_64 host with Docker and Docker Compose
- LLM API key (Anthropic or other provider supported by `@kilocode/cli`)
- SimpleX Chat app for messaging

---

## [1.0.0] — Initial Release

- Local PKM agent system running via Kilo CLI
- Four agents: `simpleclaw`, `memory-keeper`, `idea-generator`, `blog-writer`
- Markdown Zettelkasten in `data/`
