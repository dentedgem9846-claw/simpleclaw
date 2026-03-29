# SimpleClaw Bot - Docker Setup

*Custom Dockerfiles using debian:stable-slim*

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Docker Compose                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    simpleclaw-bot                              │  │
│  │   ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐ │  │
│  │   │  simplex-chat   │  │   Bot Service    │  │  Kilo    │ │  │
│  │   │  (WebSocket :5225)│←→│  (Node.js)     │←→│  Client  │ │  │
│  │   └─────────────────┘  └──────────────────┘  └───────────┘ │  │
│  │                                                              │  │
│  │   Base: debian:stable-slim                                   │  │
│  │   + simplex-chat binary                                       │  │
│  │   + Node.js 20                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Volume Mounts:                                                    │
│  - ./data → /workspace/data (RO)                                   │
│  - ./core → /workspace/core (RO)                                    │
│  - ./kilo → /workspace/.kilo (RO)                                  │
│  - bot-data → /app/data (RW)                                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Dockerfile (bot/Dockerfile)

```dockerfile
FROM debian:stable-slim AS base

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    sqlite3 \
    libsqlite3-0 \
    libgmp10 \
    libnuma1 \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Install simplex-chat from GitHub releases
ENV SIMPLEX_VERSION=latest
RUN curl -L -o /usr/local/bin/simplex-chat \
    "https://github.com/simplex-chat/simplex-chat/releases/${SIMPLEX_VERSION}/download/simplex-chat-ubuntu-22_04-x86_64" \
    && chmod +x /usr/local/bin/simplex-chat

# Install Node.js 20.x from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN simplex-chat -h | head -5 \
    && node --version \
    && npm --version

# Create app user
RUN groupadd -r bot && useradd -r -g bot bot

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY --chown=bot:bot . .

# Switch to non-root user
USER bot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

---

## Docker Compose (docker-compose.yml)

```yaml
version: '3.8'

services:
  simpleclaw-bot:
    build:
      context: ./bot
      dockerfile: Dockerfile
    container_name: simpleclaw-bot
    environment:
      # Kilo API (external)
      - KILO_API_URL=${KILO_API_URL:-http://host.docker.internal:4096}
      - KILO_PASSWORD=${KILO_PASSWORD:-}
      
      # Simplex settings
      - SIMPLEX_PORT=5225
      - SIMPLEX_DATA_DIR=/app/simplex-data
      
      # Bot settings
      - BOT_DATA_DIR=/app/data
      - ZETTEL_DIR=/workspace/data/zettels
      - INBOX_DIR=/workspace/data/inbox
      - AGENT_CONFIG_DIR=/workspace/.kilo/agents
      
      # Logging
      - LOG_LEVEL=${LOG_LEVEL:-info}
    volumes:
      # Read-only access to user's data
      - ./data:/workspace/data:ro
      - ./core:/workspace/core:ro
      - ./.kilo/agents:/workspace/.kilo/agents:ro
      
      # Bot's own data
      - bot-data:/app/data
      - simplex-data:/app/simplex-data
      
      # Allow bot to write to inbox
      - ./data/inbox:/workspace/data/inbox:rw
      
      # Kilo config (for session persistence)
      - ./kilo-config:/app/.kilo:rw
    ports:
      - "127.0.0.1:8080:8080"  # Health check
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  bot-data:
  simplex-data:
  kilo-config:
```

---

## Alternative: Kilo Server in Docker

If you want Kilo server also in Docker:

### Dockerfile.kilo (alternative)

```dockerfile
FROM debian:stable-slim

# Install Node.js 20.x
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Kilo CLI
RUN npm install -g @kilocode/cli

# Create user
RUN groupadd -r kilo && useradd -r -g kilo kilo

WORKDIR /workspace

# Switch to user
USER kilo

EXPOSE 4096

CMD ["kilo", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
```

### Updated docker-compose.yml (with integrated Kilo)

```yaml
version: '3.8'

services:
  simpleclaw-bot:
    build:
      context: ./bot
      dockerfile: Dockerfile
    container_name: simpleclaw-bot
    environment:
      - KILO_API_URL=http://kilo-server:4096
      - KILO_PASSWORD=${KILO_PASSWORD:-}
      - SIMPLEX_PORT=5225
      - SIMPLEX_DATA_DIR=/app/simplex-data
      - BOT_DATA_DIR=/app/data
      - ZETTEL_DIR=/workspace/data/zettels
      - INBOX_DIR=/workspace/data/inbox
      - AGENT_CONFIG_DIR=/workspace/.kilo/agents
      - LOG_LEVEL=${LOG_LEVEL:-info}
      # Kilo needs ANTHROPIC_API_KEY
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./data:/workspace/data:ro
      - ./core:/workspace/core:ro
      - ./.kilo/agents:/workspace/.kilo/agents:ro
      - bot-data:/app/data
      - simplex-data:/app/simplex-data
      - ./data/inbox:/workspace/data/inbox:rw
      - kilo-sessions:/root/.local/share/kilo/sessions
    depends_on:
      kilo-server:
        condition: service_healthy
    restart: unless-stopped

  kilo-server:
    build:
      context: ./kilo
      dockerfile: Dockerfile
    container_name: simpleclaw-kilo
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - KILO_SERVER_PASSWORD=${KILO_PASSWORD:-}
    volumes:
      - ./:/workspace:ro
      - ./.kilo:/workspace/.kilo:ro
      - kilo-sessions:/root/.local/share/kilo/sessions
    ports:
      - "127.0.0.1:4096:4096"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "sh", "-c", "curl -f http://localhost:4096/global/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  bot-data:
  simplex-data:
  kilo-sessions:
```

---

## Key Points

### simplex-chat in Docker

1. **Binary download**: Prebuilt binaries available at GitHub releases
2. **Platform**: Linux x86_64 (ubuntu-22_04-x86_64)
3. **No compilation needed**: Direct download works
4. **WebSocket server**: Run with `-p PORT` flag

### Kilo CLI in Docker

1. **npm package**: `@kilocode/cli`
2. **Install globally**: `npm install -g @kilocode/cli`
3. **Run serve**: `kilo serve --port 4096`
4. **Requires**: Node.js 18+ (we use 20)

### WebSocket Communication

simplex-chat uses WebSocket for bot communication:
- Bot connects as WebSocket **client** to simplex-chat
- Commands sent as JSON: `{"corrId": "...", "cmd": "..."}`
- Responses received as JSON: `{"corrId": "...", "resp": {...}}`
- Events (no corrId): `{"resp": {"type": "...", ...}}`

### Required npm packages for bot

```json
{
  "dependencies": {
    "ws": "^8.16.0",
    "better-sqlite3": "^9.4.0",
    "dotenv": "^16.4.0"
  }
}
```

---

## Build and Run

```bash
# Build the bot
docker-compose build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f simpleclaw-bot

# Stop
docker-compose down
```

---

## First Run Setup

On first run, the bot needs to:
1. Create a bot profile in simplex-chat
2. Generate a connection address
3. Enable auto-accept for contacts

This can be done via simplex-chat commands:
```bash
docker-compose exec simpleclaw-bot simplex-chat -p 5225
# Then run interactive commands:
# /create bot simpleclaw "SimpleClaw Bot"
# /ad  # Create address
# /set address auto_accept on
```

Or programmatically via WebSocket API in the bot code.
