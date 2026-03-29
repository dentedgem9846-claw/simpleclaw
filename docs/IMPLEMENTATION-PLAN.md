# SimpleClaw Bot - Implementation Plan

*Version 3.0 | Managed Mode | Custom Docker | Verified*

---

## Design Philosophy

- **Tightly coupled** - Components know about each other, no abstractions
- **Simple** - Clear data flow, no indirection
- **Practical** - Works with how simplex-chat and Kilo actually work
- **Self-contained** - Custom Dockerfiles, no official images needed

**Decision: Managed Mode**
The bot spawns `simplex-chat` as a child process. No separate simplex-cli container.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     3 Separate Container Types                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────┐  ┌───────────────────────┐              │
│  │   simplex-chat-1      │  │      kilo-1           │              │
│  │                       │  │                       │              │
│  │  debian:stable-slim   │  │  debian:stable-slim   │              │
│  │  + simplex-chat binary│  │  + Node.js 20         │              │
│  │                       │  │  + @kilocode/cli      │              │
│  │  WebSocket :5225     │  │                       │              │
│  │                       │  │  HTTP API :4096      │              │
│  │  Isolated data vol   │  │                       │              │
│  └───────────┬───────────┘  └───────────┬───────────┘              │
│              │                          │                            │
│              │  ws://...                │  http://...               │
│              │                          │                            │
│              ▼                          ▼                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    simpleclaw-bot-1                            │  │
│  │                                                               │  │
│  │  debian:stable-slim + Node.js 20                             │  │
│  │                                                               │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │   │ SimplexWs    │  │  KiloClient  │  │  MemoryStore  │   │  │
│  │   │              │  │              │  │              │   │  │
│  │   │ - WebSocket  │  │ - sessions   │  │ - SQLite     │   │  │
│  │   │ - connect    │  │ - SSE events │  │ - per-contact│   │  │
│  │   │ - send/recv  │  │ - HTTP calls │  │ - history    │   │  │
│  │   └──────┬───────┘  └──────┬───────┘  └───────┬────────┘   │  │
│  │          │                  │                  │              │  │
│  │          └──────────────────┼──────────────────┘              │  │
│  │                             │                                 │  │
│  │                    ┌────────┴────────┐                       │  │
│  │                    │   MessageLoop    │                       │  │
│  │                    │                  │                       │  │
│  │                    │ - receive msg    │                       │  │
│  │                    │ - load context   │                       │  │
│  │                    │ - call Kilo     │                       │  │
│  │                    │ - send response │                       │  │
│  │                    └─────────────────┘                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Point**: Each container type is independent and scalable:
- Multiple `simplex-chat-*` instances (different bots)
- Multiple `kilo-*` instances (different AI configs)
- Multiple `simpleclaw-bot-*` instances (connect to specific simplex + kilo)
┌─────────────────────────────────────────────────────────────────────┐
│                     simpleclaw-bot Container                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        Bot Service                             │  │
│  │                                                               │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │   │ SimplexWs    │  │  KiloClient  │  │  MemoryStore  │   │  │
│  │   │              │  │              │  │              │   │  │
│  │   │ - WebSocket  │  │ - sessions   │  │ - SQLite     │   │  │
│  │   │ - connect    │  │ - SSE events │  │ - per-contact│   │  │
│  │   │ - send/recv  │  │ - HTTP calls │  │ - history    │   │  │
│  │   └──────┬───────┘  └──────┬───────┘  └───────┬────────┘   │  │
│  │          │                  │                  │              │  │
│  │          └──────────────────┼──────────────────┘              │  │
│  │                             │                                 │  │
│  │                    ┌────────┴────────┐                       │  │
│  │                    │   MessageLoop    │                       │  │
│  │                    │                  │                       │  │
│  │                    │ - receive msg    │                       │  │
│  │                    │ - load context   │                       │  │
│  │                    │ - call Kilo     │                       │  │
│  │                    │ - send response │                       │  │
│  │                    └─────────────────┘                       │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                        │
│  ┌──────────────────────────┼────────────────────────────────┐   │
│  │              simplex-chat Process (child)                     │   │
│  │                                                               │   │
│  │   simplex-chat -p 5225 -d /app/simplex-data                 │   │
│  │                                                               │   │
│  │   ↕ spawns ↕ WebSocket :5225 ↔ SimpleX Network               │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Base Image: debian:stable-slim                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    Optional: kilo-server Container                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Kilo Code Serve                            │   │
│   │                                                               │   │
│   │   kilo serve --port 4096                                   │   │
│   │                                                               │   │
│   │   Base Image: debian:stable-slim + Node.js 20               │   │
│   │   + npm install -g @kilocode/cli                            │   │
│   │                                                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
simpleclaw/
├── docker-compose.yml              # Orchestration (all 3 container types)
├── .env.example                   # Environment variables
│
├── containers/                     # Reusable container definitions
│   ├── simplex-chat/
│   │   ├── Dockerfile             # debian:stable-slim + simplex-chat binary
│   │   └── docker-entrypoint.sh   # Optional: first-run setup
│   │
│   └── kilo/
│       └── Dockerfile             # debian:stable-slim + Node.js + @kilocode/cli
│
├── bot/                           # Bot service (orchestrator)
│   ├── Dockerfile                 # debian:stable-slim + Node.js 20
│   ├── package.json               # Dependencies
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Entry point
│       ├── simplex/
│       │   ├── websocket.ts       # WebSocket CLIENT to simplex-chat
│       │   ├── protocol.ts        # JSON encode/decode
│       │   └── types.ts           # SimpleX types
│       ├── kilo/
│       │   ├── client.ts          # HTTP client to Kilo API
│       │   ├── session.ts         # Session management
│       │   └── types.ts           # Kilo types
│       ├── memory/
│       │   ├── store.ts           # SQLite CRUD
│       │   └── schema.ts          # Table definitions
│       ├── loop.ts                # Main message loop
│       └── types.ts               # Shared types
│
├── data/                          # Mounted RO to bot
│   ├── inbox/
│   ├── zettels/
│   ├── diary/
│   └── archive/
├── .kilo/
│   └── agents/
│       ├── simpleclaw.md
│       └── memory-keeper.md
├── core/                          # Mounted RO to bot
│   ├── CLAW.md
│   └── USER.md
└── docs/
    ├── ARCHITECTURE.md            # Container architecture details
    ├── IMPLEMENTATION-PLAN.md     # This file
    ├── docker-setup.md            # Docker setup reference
    └── simplex/
        ├── bot-api.md
        ├── cli.md
        ├── events-reference.md
        └── commands-reference.md
```

---

## Docker Containers (3 Separate Types)

### 1. containers/simplex-chat/Dockerfile

```dockerfile
FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates sqlite3 libsqlite3-0 libgmp10 libnuma1 libssl3 netcat-openbsd

# simplex-chat binary (prebuilt from GitHub)
RUN curl -L -o /usr/local/bin/simplex-chat \
    "https://github.com/simplex-chat/simplex-chat/releases/latest/download/simplex-chat-ubuntu-22_04-x86_64" \
    && chmod +x /usr/local/bin/simplex-chat

# Health check support
RUN apt-get install -y netcat-openbsd || true

EXPOSE 5225

# Data volume mount point
VOLUME ["/data"]

CMD ["simplex-chat", "-p", "5225", "-d", "/data"]
```

### 2. containers/kilo/Dockerfile

```dockerfile
FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates wget

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Kilo CLI
RUN npm install -g @kilocode/cli

# Health check
RUN apt-get install -y wget || true

EXPOSE 4096

# Session persistence
VOLUME ["/root/.local/share/kilo/sessions"]

WORKDIR /workspace

CMD ["kilo", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
```

### 3. bot/Dockerfile

```dockerfile
FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates sqlite3 libsqlite3-0 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

---

## WebSocket Communication (VERIFIED)

### How simplex-chat works:

1. **Start as WebSocket server**: `simplex-chat -p 5225`
2. **Bot connects as WebSocket CLIENT** to `ws://localhost:5225`
3. **Send commands** as JSON:
```json
{"corrId": "msg-001", "cmd": "/_send @123 json [{\"msgContent\":{\"text\":\"Hello!\"}}]"}
```
4. **Receive responses** as JSON:
```json
{"corrId": "msg-001", "resp": {"type": "newChatItems", ...}}
```
5. **Receive events** (no corrId):
```json
{"resp": {"type": "newChatItems", "chatItems": [...]}}
```

### Required npm packages:

```json
{
  "dependencies": {
    "ws": "^8.16.0",          // WebSocket client
    "better-sqlite3": "^9.4.0", // SQLite
    "dotenv": "^16.4.0"       // Env vars
  }
}
```

---

## Data Flow (VERIFIED)

```
1. User sends DM on SimpleX app
         ↓
2. SimpleX Network → simplex-chat (child process)
         ↓
3. Bot receives via WebSocket:
   {"resp": {"type": "newChatItems", "chatItems": [...]}}
         ↓
4. Bot parses message:
   - contactId from chatItems[].chatDir.contact.contactId
   - text from chatItems[].chatItem.content.msgContent.text
         ↓
5. Bot loads from SQLite:
   - Conversation history
   - Contact preferences
   - Kilo session ID
         ↓
6. Bot builds prompt:
   - Read .kilo/agents/simpleclaw.md
   - Read core/CLAW.md
   - Add conversation history
   - Add user message
         ↓
7. Bot calls Kilo:
   POST http://kilo:4096/session/{sessionId}/chat
         ↓
8. Bot listens to SSE:
   GET http://kilo:4096/event
   - text chunks → accumulate
   - turn_end → response complete
         ↓
9. Bot stores in SQLite:
   - User message
   - Bot response
         ↓
10. Bot sends response:
    {"corrId": "msg-002", "cmd": "/_send @123 json [{\"msgContent\":{\"text\":\"...\"}}]"}
         ↓
11. simplex-chat → SimpleX Network → User
```

---

## Implementation Phases

### Phase 1: Project Setup

**Tasks:**
1. Create directory structure
2. Create `bot/package.json`:
   - `ws` - WebSocket client (REQUIRED)
   - `better-sqlite3` - SQLite
   - `dotenv` - Env vars
   - `tsx` - TypeScript runner
3. Create `bot/tsconfig.json`
4. Create `bot/Dockerfile` (debian:stable-slim + simplex-chat + Node.js)
5. Create `docker-compose.yml`
6. Create `kilo/Dockerfile` (optional)
7. Create `.env.example`

### Phase 2: Simplex WebSocket Client

**Tasks:**
1. Implement `simplex/process.ts`:
   ```typescript
   async startSimplexChat(port: number, dataDir: string): Promise<void>
   stop(): Promise<void>
   ```
2. Implement `simplex/websocket.ts`:
   ```typescript
   class SimplexWsClient {
     constructor(url: string)
     connect(): Promise<void>
     send(cmd: string): Promise<Response>
     onEvent(handler: (event: SimplexEvent) => void): void
     onResponse(corrId: string, handler: (resp: Response) => void): void
   }
   ```
3. Implement `simplex/protocol.ts`:
   ```typescript
   encodeCommand(corrId: string, cmd: string): string
   decodeResponse(data: string): ParsedResponse
   ```
4. Implement `simplex/types.ts`:
   ```typescript
   interface SimplexEvent {
     type: 'newChatItems' | 'contactConnected' | ...
     chatItems?: ChatItem[]
     contact?: Contact
   }
   ```

### Phase 3: Kilo HTTP Client

**Tasks:**
1. Implement `kilo/client.ts`:
   ```typescript
   class KiloClient {
     constructor(baseUrl: string, password?: string)
     createSession(directory?: string): Promise<string>
     chat(sessionId: string, parts: Part[]): Promise<void>
     onEvent(handler: (event: KiloEvent) => void): void
     abort(sessionId: string): Promise<void>
     health(): Promise<boolean>
   }
   ```
2. Implement `kilo/session.ts`:
   ```typescript
   class SessionManager {
     createSession(): Promise<string>
     getSession(contactId: string): string | null
     setSession(contactId: string, sessionId: string): void
   }
   ```

### Phase 4: SQLite Memory Store

**Tasks:**
1. Implement `memory/schema.ts`:
   ```sql
   CREATE TABLE contacts (
     contact_id TEXT PRIMARY KEY,
     simplex_contact_id INTEGER,
     kilo_session_id TEXT,
     display_name TEXT,
     first_seen INTEGER,
     last_active INTEGER
   );
   
   CREATE TABLE messages (
     id INTEGER PRIMARY KEY,
     contact_id TEXT,
     role TEXT CHECK(role IN ('user', 'assistant')),
     content TEXT,
     created_at INTEGER
   );
   ```
2. Implement `memory/store.ts`:
   ```typescript
   getHistory(contactId: string, limit?: number): Message[]
   addMessage(contactId: string, role: string, content: string): void
   getOrCreateContact(simplexContactId: number): Contact
   getKiloSession(contactId: string): string | null
   setKiloSession(contactId: string, sessionId: string): void
   ```

### Phase 5: Main Message Loop

**Tasks:**
1. Implement `loop.ts`:
   ```typescript
   class MessageLoop {
     constructor(
       simplex: SimplexWsClient,
       kilo: KiloClient,
       memory: MemoryStore
     )
     
     async start(): Promise<void>
     
     private async handleNewMessage(event: NewChatItemsEvent): Promise<void> {
       // 1. Extract contactId and text
       // 2. Load history
       // 3. Build prompt with agent config
       // 4. Stream to Kilo
       // 5. Send response via Simplex
       // 6. Store in memory
     }
   }
   ```

### Phase 6: Bot Profile Setup

**Tasks:**
1. First-run initialization:
   - Create bot profile: `apiCreateProfile simpleclaw "SimpleClaw Bot"`
   - Create address: `apiCreateMyAddress`
   - Enable auto-accept: `apiSetAddressSettings`
2. Store bot address for user to share

### Phase 7: Integration & Testing

**Tasks:**
1. Wire everything in `index.ts`
2. Add health check endpoint (HTTP GET /health)
3. Add graceful shutdown (SIGTERM handler)
4. Test full flow:
   - Start containers
   - Get bot address
   - Send test message
   - Verify response

### Phase 8: Polish

**Tasks:**
1. Structured logging (JSON)
2. Error handling with retries
3. Volume permissions
4. Documentation

---

## Configuration

### .env.example

```
# Required for Kilo
ANTHROPIC_API_KEY=sk-ant-...

# Optional
KILO_PASSWORD=your-secure-password
LOG_LEVEL=info
```

### docker-compose.yml (Full Multi-Instance)

```yaml
version: '3.8'

services:
  # ============================================
  # Simplex Chat Instance
  # ============================================
  simplex-chat-1:
    build:
      context: ./containers/simplex-chat
      dockerfile: Dockerfile
    container_name: simpleclaw-simplex-1
    volumes:
      - simplex-data-1:/data
    ports:
      - "127.0.0.1:5225:5225"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "5225"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Kilo Server Instance
  # ============================================
  kilo-1:
    build:
      context: ./containers/kilo
      dockerfile: Dockerfile
    container_name: simpleclaw-kilo-1
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - KILO_SERVER_PASSWORD=${KILO_PASSWORD:-}
    volumes:
      - ./:/workspace:ro
      - ./.kilo:/workspace/.kilo:ro
      - kilo-data-1:/root/.local/share/kilo/sessions
    ports:
      - "127.0.0.1:4096:4096"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4096/global/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Bot Instance (connects to specific simplex + kilo)
  # ============================================
  simpleclaw-bot-1:
    build:
      context: ./bot
      dockerfile: Dockerfile
    container_name: simpleclaw-bot-1
    environment:
      # Connect to specific instances
      - SIMPLEX_WS_URL=ws://simplex-chat-1:5225
      - KILO_API_URL=http://kilo-1:4096
      - KILO_PASSWORD=${KILO_PASSWORD:-}
      - BOT_DATA_DIR=/app/data
      - LOG_LEVEL=${LOG_LEVEL:-info}
    volumes:
      - ./data:/workspace/data:ro
      - ./core:/workspace/core:ro
      - ./.kilo/agents:/workspace/.kilo/agents:ro
      - bot-data-1:/app/data
    depends_on:
      simplex-chat-1:
        condition: service_healthy
      kilo-1:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  simplex-data-1:
  kilo-data-1:
  bot-data-1:
```

---

## Testing Checklist

- [ ] Bot container builds
- [ ] simplex-chat binary runs in container
- [ ] simplex-chat spawns as child process
- [ ] WebSocket connects to simplex-chat
- [ ] Bot receives messages via WebSocket
- [ ] Bot can send messages via WebSocket
- [ ] Kilo server starts
- [ ] Bot connects to Kilo API
- [ ] Bot calls Kilo and receives responses
- [ ] SQLite stores history
- [ ] History persists across restarts
- [ ] Bot profile created on first run
- [ ] Connection address generated
- [ ] Health check works
- [ ] Graceful shutdown works

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| Custom Dockerfiles | No official images available |
| debian:stable-slim | Minimal, stable base |
| WebSocket client | simplex-chat is WebSocket server |
| ws npm package | Standard WebSocket client for Node.js |
| better-sqlite3 | Native SQLite bindings |
| One Kilo session per contact | Maintains conversation context |

---

## Missing/Unverified Items

| Item | Status | Notes |
|------|--------|-------|
| simplex-chat binary URL | ✅ VERIFIED | GitHub releases |
| @kilocode/cli npm | ✅ VERIFIED | v7.1.9 available |
| Kilo serve SSE filtering | ❓ UNVERIFIED | Need to test |
| Bot profile creation | ✅ VERIFIED | Via WebSocket API |
| Auto-accept contacts | ✅ VERIFIED | Via apiSetAddressSettings |

---

## References

- Docker Setup: `docs/docker-setup.md`
- SimpleX Bot API: `docs/simplex/`
- Kilo HTTP API: `docs/kilo/http-api.md`

---

*Plan v3.0 - Custom Docker, verified binaries, WebSocket communication*
