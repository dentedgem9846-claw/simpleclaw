# Kilo Code HTTP API Reference

Source: DeepWiki - Kilo-Org/kilocode/13.1-http-api-reference

## Base URL

```
http://localhost:4096
```

## Authentication

Optional Basic Auth via `KILO_SERVER_PASSWORD` env var:
```
Authorization: Basic base64(kilo:password)
```

## Endpoints

### Global

| Method | Path | Description |
|--------|------|-------------|
| GET | `/global/health` | Health check - `{ healthy: true, version: string }` |
| GET | `/global/event` | SSE stream of system events |
| GET | `/global/config` | Get global config |
| PATCH | `/global/config` | Update global config |
| POST | `/global/dispose` | Dispose all instances |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/auth/{providerID}` | Store credentials |
| DELETE | `/auth/{providerID}` | Remove credentials |

Auth shapes:
```json
{ "type": "api", "key": "..." }
{ "type": "oauth", "access": "...", "refresh": "...", "accountId": "..." }
```

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/session` | Create new session |
| POST | `/session/{sessionID}/chat` | Send prompt to agent |
| POST | `/session/{sessionID}/abort` | Cancel agent loop |
| POST | `/session/{sessionID}/revert` | Revert to snapshot |

### PTY

| Method | Path | Description |
|--------|------|-------------|
| POST | `/pty` | Create PTY session |
| GET | `/pty/{ptyID}/connect` | WebSocket to PTY |

## Chat Request Format

```json
{
  "parts": [
    { "type": "text", "text": "...", "metadata": { "role": "user" } }
  ],
  "model": { "providerID": "anthropic", "modelID": "claude-sonnet-4" },
  "editorContext": {
    "visibleFiles": ["file.ts"],
    "openTabs": ["file.ts"],
    "activeFile": "file.ts"
  }
}
```

## SSE Events

Two SSE streams:
- `GET /global/event` - Server-wide events
- `GET /event` - Per-instance session events

Event types include:
- `text` - Streaming text
- `tool_call` - Tool invocation
- `tool_call_update` - Tool progress
- `turn_end` - Response complete

## Tool Part Schema

```json
{
  "callID": "unique-id",
  "tool": "bash|edit|read|...",
  "state": "pending|running|completed|error"
}
```

## Error Types

| Name | Description |
|------|-------------|
| `ProviderAuthError` | LLM auth failure |
| `APIError` | Upstream API failure |
| `ContextOverflowError` | Context limit reached |
| `MessageOutputLengthError` | Max output tokens |

## CLI Serve Command

```bash
kilo serve --port 4096 --hostname 0.0.0.0
```

Options:
- `--port` - Port (default: random)
- `--hostname` - Host (default: 127.0.0.1)
- `--mdns` - Enable mDNS discovery
- `--cors` - Additional CORS domains

## ACP (Agent Client Protocol)

```bash
kilo acp --port 4096 --cwd /workspace
```

ACP is a JSON-RPC protocol over stdio for editor integration.
