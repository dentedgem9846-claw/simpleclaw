# SimpleClaw

*A personal memory system and creative partner powered by Kilo AI.*

## What is SimpleClaw?

SimpleClaw is a personal knowledge management system built on Kilo AI. It follows Zettelkasten principles to create an atomic note system that:
- Remembers everything you share
- Surfaces relevant context automatically
- Creates blog posts while you sleep
- Discovers connections across your notes

## Core Philosophy

SimpleClaw follows 32 principles from PKM, Second Brain, and AI Memory research:
- **Conversation is the interface** - No commands, just talk
- **Memory is contextual** - Surfaces what you need before you ask
- **Atomicity** - One idea per note, linked to others
- **Frictionless capture** - Propose, don't demand
- **Human sovereignty** - You own your data

See [core/CLAW.md](core/CLAW.md) for full principles.

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

- Docker and Docker Compose
- An AI API key (see [AI Providers](#ai-providers) below)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd simpleclaw
cp .env.example .env
```

### 2. Configure Kilo Gateway

1. Get your Kilo API key from https://app.kilo.ai/
2. Edit `.env`:
   ```
   KILO_API_KEY=klo_...
   # Optional - only if your Kilo server requires authentication
   # KILO_PASSWORD=your-secure-password
   ```

### 3. Start the Bot

```bash
# Build and start all containers (uses .env file automatically)
docker-compose up -d --build

# Watch logs
docker-compose logs -f
```

**Note:** `docker-compose` automatically reads variables from `.env` in the same directory.

### 4. Get the Bot Address

```bash
# Find the connection address in logs
docker-compose logs simpleclaw-bot-1 | grep -i "connLink\|address"
```

Example output:
```
Bot address created {"link": "simplex:/alice123...xyz#false"}
```

### 5. Connect via SimpleX Chat

1. Install [SimpleX Chat](https://simplex.chat/) on your phone or desktop
2. Add contact → Enter connection address → Paste the `simplex:/...` address
3. Send a message to the bot

The bot will respond using Kilo AI with access to your memory system.

## How It Works

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

### Daily Usage

Just speak naturally:
```
"Jane's birthday is August 15, she's a senior engineer on the platform team"
```

SimpleClaw will:
1. Create a zettel in `data/zettels/`
2. Link to related notes
3. Surface it when relevant

## Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Bot not responding

1. Check health endpoint:
   ```bash
   curl http://localhost:8080/health
   ```
2. Verify Kilo is healthy:
   ```bash
   docker-compose logs kilo-1
   ```
3. Check SimpleX connection:
   ```bash
   docker-compose logs simplex-chat-1
   ```

### View/Edit Data

```bash
# Access bot database
docker-compose exec simpleclaw-bot-1 sqlite3 /app/data/bot.db

# List zettels
ls -la data/zettels/

# View inbox
ls -la data/inbox/
```

---

## Configuration

Create `.kilo/agents/my-worker.md` following the existing patterns.

### Customizing Personalities

Edit agent files in `.kilo/agents/`. Each worker has a distinct voice while following CLAW principles.

## Troubleshooting

Ask Kilo Code to fix it.

## License

MIT
