# Setup SimpleClaw

SimpleClaw is a personal memory system with a SimpleX Chat bot interface.

## Prerequisites

- Docker and Docker Compose
- A Kilo API key from https://app.kilo.ai/

## Quick Start

### 1. Copy Environment File

```bash
cp .env.example .env
```

### 2. Configure Kilo API

Edit `.env`:
```
KILO_API_KEY=klo_...
# Optional - only if your Kilo server requires authentication
# KILO_PASSWORD=your-secure-password
```

### 3. Build and Start

```bash
docker-compose up -d --build
```

Docker Compose automatically reads `.env` in the same directory.

### 4. Get the Bot Address

```bash
docker-compose logs simpleclaw-bot-1 | grep -i "connLink\|address"
```

### 5. Connect via SimpleX Chat

1. Install [SimpleX Chat](https://simplex.chat/)
2. Add contact → Paste the `simplex:/...` address from step 4
3. Send a message to the bot

## Optional: Configure Your Profile

Edit `core/USER.md` with your preferences:
- Name and timezone
- Current projects
- Communication preferences
- Morning/evening routine times

## Troubleshooting

```bash
# Check logs
docker-compose logs -f

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build

# Access bot database
docker-compose exec simpleclaw-bot-1 sqlite3 /app/data/bot.db
```
