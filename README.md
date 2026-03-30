# SimpleClaw

*A personal memory system and creative partner powered by Kilo AI.*

## What is SimpleClaw?

SimpleClaw is a personal knowledge management system that combines:
- **SimpleX Chat** - Encrypted, serverless messaging bot interface
- **Kilo AI** - Local AI agent with skills to read/write files, search, browse

It follows Zettelkasten principles to create an atomic note system that:
- Remembers everything you share via SimpleX Chat
- Surfaces relevant context automatically
- Creates blog posts while you sleep
- Discovers connections across your notes

## Features

- **Private & Encrypted** - Messages go directly between your app and the bot
- **Local AI** - Runs locally via Docker (no cloud AI calls)
- **Zettelkasten Memory** - Atomic notes with wikilinks
- **Background Workers** - Memory Keeper, Idea Generator, Blog Writer

## Architecture

```
simpleclaw/
├── .kilo/                    # Kilo AI configuration
│   └── agents/              # Agent definitions
│       ├── simpleclaw.md     # Main interface
│       ├── memory-keeper.md  # Organizes inbox
│       ├── idea-generator.md # Discovers connections
│       └── blog-writer.md    # Creates blog posts
│
├── bot/                      # SimpleX Chat bot
│   ├── src/
│   │   ├── index.ts          # Main entry
│   │   ├── loop.ts           # Message processing
│   │   ├── kilo/             # Kilo API client
│   │   └── simplex/          # SimpleX WebSocket client
│   └── Dockerfile
│
├── core/                     # System files
│   ├── CLAW.md              # Philosophy & constraints
│   ├── USER.md              # Your profile
│   └── NOW.md               # Session state
│
└── data/                    # Your content
    ├── inbox/              # Raw captures
    ├── zettels/            # Atomic notes
    ├── diary/              # Daily reflections
    └── synthesis/          # Generated content
```

## Quick Start

### Prerequisites

- Docker and Docker Compose v2+
- SimpleX Chat app (mobile or desktop)
- Optional: Kilo API key for enhanced AI (can run free tier)

### Setup

```bash
git clone https://github.com/dentedgem9846-claw/simpleclaw.git
cd simpleclaw
cp .env.example .env
```

Edit `.env` with your configuration (see `.env.example` for options).

### Run

```bash
docker compose up -d --build
docker compose logs simpleclaw-bot-1 | grep -i "address"
```

The bot will print a connection address (e.g., `sm://...@smp.simplex.im`). 
Open SimpleX Chat, add a contact using that address, and start chatting!

### Default Greeting

When you first connect, the bot sends:
```
Hello! I'm SimpleClaw, your personal knowledge assistant. Send /help for available commands.
```

## How It Works

### SimpleX Chat Integration

The bot connects to SimpleX servers and waits for contact requests. Once connected:
- Messages are encrypted end-to-end
- No server-side storage of messages
- Bot responds in real-time via Kilo AI

### Kilo AI Agent

The bot forwards messages to a local Kilo AI agent which:
- Has tools: read/write files, search, web fetch, browser automation
- Follows CLAW.md principles (see `core/CLAW.md`)
- Manages your Zettelkasten memory system

### Zettelkasten System

Everything is a **zettel** (atomic note):
- One idea per note
- Linked with `[[wikilinks]]`
- Tagged for organization
- Tracked with timestamps

### Workers

Invoke workers for background tasks:
- **Memory Keeper** - Organizes inbox into zettels
- **Idea Generator** - Discovers connections across notes
- **Blog Writer** - Creates blog posts from your ideas

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SIMPLEX_WS_URL` | SimpleX WebSocket URL | `ws://simpleclaw-simplex-1:5225` |
| `KILO_API_URL` | Local Kilo API URL | `http://simpleclaw-kilo-1:4096` |
| `KILO_API_KEY` | Kilo cloud API key (optional) | - |
| `KILO_PASSWORD` | Local Kilo password | - |
| `BOT_DATA_DIR` | Bot data directory | `/app/data` |

### Agent Permissions

Edit `.kilo/agents/simpleclaw.md` to configure:
- `read`/`write` - File access permissions
- `bash` - Shell command access
- `webfetch` - Web fetch capability
- `browser` - Browser automation capability
- `task` - Worker invocation permissions

## Troubleshooting

```bash
# Check all containers
docker compose ps

# Check bot health
curl http://localhost:8080/health

# View bot logs
docker compose logs simpleclaw-bot-1 --tail=100

# View Kilo logs
docker compose logs simpleclaw-kilo-1 --tail=50

# Restart everything
docker compose restart
```

**See [.kilocode/workflows/setup.md](.kilocode/workflows/setup.md) for detailed troubleshooting.**

## Development

### Bot Development

```bash
cd bot
npm install
npm run dev      # Watch mode with ts-node
npm run build    # Production build
npm run precommit # Lint, typecheck, test
```

### Agent Development

Edit files in `.kilo/agents/`. The bot automatically loads agent configurations.

## License

MIT
