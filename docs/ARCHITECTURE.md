# Architecture: Separate, Independently Scalable Containers

## Rationale

- **Multiple simplex-chat instances**: Different bots, different identities, isolated state
- **Multiple Kilo instances**: Different AI configs, different agent sets, load balancing
- **Bot is the orchestrator**: Connects to one simplex + one Kilo, but can run multiple bots

## Final Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Docker Compose                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ │
│  │   simplex-chat-1   │  │    simpleclaw-bot   │  │  kilo-1     │ │
│  │                     │◄─│                     │◄─│              │ │
│  │  simplex-chat      │  │  Bot Service       │  │  kilo serve │ │
│  │  WebSocket :5225   │  │                    │  │  HTTP :4096 │ │
│  │                     │  │  - Memory          │  │              │ │
│  │  Data: simplex-1   │  │  - Loop            │  │  Data: kilo  │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────┘ │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ │
│  │   simplex-chat-2   │  │   simpleclaw-bot-2 │  │  kilo-2     │ │
│  │                     │◄─│                     │◄─│              │ │
│  │  simplex-chat      │  │  Bot Service        │  │  kilo serve │ │
│  │  WebSocket :5225   │  │                    │  │  HTTP :4096  │ │
│  │                     │  │  Different config   │  │              │ │
│  │  Data: simplex-2   │  │                    │  │  Data: kilo  │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Container Breakdown

### Container: `simplex-chat-*`

**Purpose**: Run simplex-chat CLI as WebSocket server

**Base Image**: `debian:stable-slim`

**Exposes**: WebSocket port (default 5225)

**Data Volume**: Isolated per instance

**Configuration**:
- Bot display name
- Auto-accept settings
- Network settings (Tor, etc.)

```dockerfile
FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates sqlite3 libsqlite3-0 libgmp10 libnuma1 libssl3

RUN curl -L -o /usr/local/bin/simplex-chat \
    "https://github.com/simplex-chat/simplex-chat/releases/latest/download/simplex-chat-ubuntu-22_04-x86_64" \
    && chmod +x /usr/local/bin/simplex-chat

EXPOSE 5225

CMD ["simplex-chat", "-p", "5225", "-d", "/data"]
```

### Container: `kilo-*`

**Purpose**: Run Kilo Code server for AI processing

**Base Image**: `debian:stable-slim`

**Exposes**: HTTP port (default 4096)

**Data Volume**: Session persistence

**Configuration**:
- ANTHROPIC_API_KEY
- Agent configs (mounted)
- Workspace (mounted read-only)

```dockerfile
FROM debian:stable-slim

RUN apt-get update && apt-get install -y curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

RUN npm install -g @kilocode/cli

WORKDIR /workspace

EXPOSE 4096

CMD ["kilo", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
```

### Container: `simpleclaw-bot-*`

**Purpose**: Orchestrate between simplex-chat and Kilo

**Base Image**: `debian:stable-slim` + Node.js 20

**Connects to**: One simplex-chat, one Kilo

**Configuration**:
- `SIMPLEX_WS_URL` - Which simplex-chat to connect to
- `KILO_API_URL` - Which Kilo to connect to

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

CMD ["node", "dist/index.js"]
```

---

## docker-compose.yml (Multi-Instance)

```yaml
version: '3.8'

services:
  # ============================================
  # Simplex Chat Instances (one per bot)
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
      test: ["CMD", "sh", "-c", "nc -z localhost 5225 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  # simplex-chat-2:
  #   build:
  #     context: ./containers/simplex-chat
  #     dockerfile: Dockerfile
  #   container_name: simpleclaw-simplex-2
  #   volumes:
  #     - simplex-data-2:/data
  #   ports:
  #     - "127.0.0.1:5226:5225"
  #   restart: unless-stopped

  # ============================================
  # Kilo Server Instances (scalable)
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

  # kilo-2:
  #   build:
  #     context: ./containers/kilo
  #     dockerfile: Dockerfile
  #   container_name: simpleclaw-kilo-2
  #   environment:
  #     - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  #     - KILO_SERVER_PASSWORD=${KILO_PASSWORD:-}
  #   volumes:
  #     - ./:/workspace:ro
  #     - ./.kilo:/workspace/.kilo:ro
  #     - kilo-data-2:/root/.local/share/kilo/sessions
  #   ports:
  #     - "127.0.0.1:4097:4096"
  #   restart: unless-stopped

  # ============================================
  # Bot Instances (orchestrators)
  # ============================================
  simpleclaw-bot-1:
    build:
      context: ./bot
      dockerfile: Dockerfile
    container_name: simpleclaw-bot-1
    environment:
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
  # simplex-data-2:
  kilo-data-1:
  # kilo-data-2:
  bot-data-1:
```

---

## Directory Structure

```
simpleclaw/
├── docker-compose.yml              # Orchestrates all containers
├── .env.example
│
├── containers/                     # Reusable container configs
│   ├── simplex-chat/
│   │   ├── Dockerfile
│   │   └── docker-entrypoint.sh    # First-run setup (optional)
│   │
│   └── kilo/
│       └── Dockerfile
│
├── bot/                           # Bot service
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── ...
│
├── data/                          # Mounted RO
├── core/                          # Mounted RO
├── .kilo/                         # Mounted RO
│
└── docs/
```

---

## Container Images (For Registry)

If you want to publish images:

```bash
# Build and tag
docker build -t myregistry/simpleclaw-simplex:latest ./containers/simplex-chat
docker build -t myregistry/simpleclaw-kilo:latest ./containers/kilo
docker build -t myregistry/simpleclaw-bot:latest ./bot

# Push to registry
docker push myregistry/simpleclaw-simplex:latest
docker push myregistry/simpleclaw-kilo:latest
docker push myregistry/simpleclaw-bot:latest
```

---

## Scaling Considerations

### Horizontal Scaling (Multiple Instances)

```yaml
# docker-compose.prod.yml
services:
  simpleclaw-bot:
    deploy:
      replicas: 3
    # Each bot connects to ONE simplex + ONE kilo
    # Use external load balancer for simplex-chat instances
```

### Health Checks

Each container has health checks:
- simplex-chat: TCP check on port 5225
- kilo: HTTP GET /global/health
- bot: HTTP GET /health

### Networking

All containers on same Docker network:
```yaml
networks:
  default:
    name: simpleclaw-network
```

Bot connects via container names:
- `ws://simplex-chat-1:5225`
- `http://kilo-1:4096`

---

## First-Run Setup

For each simplex-chat instance, you need to create bot profile:

```bash
# Interactive (first time)
docker exec -it simpleclaw-simplex-1 simplex-chat -p 5225

# Commands:
# /create bot simpleclaw "SimpleClaw Bot"
# /ad
# /set address auto_accept on
```

Or programmatically via WebSocket in the bot.
