---
description: Set up SimpleClaw from scratch or troubleshoot existing installation
agent: simpleclaw
---

You are setting up SimpleClaw, a personal memory system with SimpleX Chat bot interface powered by local Kilo AI.

## Prerequisites Check

Verify the user has:
- Docker and Docker Compose v2+
- SimpleX Chat app (mobile or desktop)
- Optional: Kilo API key from https://app.kilo.ai/

If missing, tell them how to install:
- Docker: https://docs.docker.com/get-docker/
- SimpleX Chat: https://simplex.chat/
- Kilo API key: https://app.kilo.ai/ (optional for local mode)

## Architecture

SimpleClaw runs 3 Docker containers:
1. **simpleclaw-simplex-1** - SimpleX Chat server for WebSocket connection
2. **simpleclaw-kilo-1** - Local Kilo AI agent (no cloud required)
3. **simpleclaw-bot-1** - Bot bridging SimpleX and Kilo

## Step 1: Clone and Configure

```bash
git clone https://github.com/dentedgem9846-claw/simpleclaw.git
cd simpleclaw
cp .env.example .env
```

Edit `.env`:
- `KILO_API_KEY` - Optional, for enhanced AI (can run free tier)
- `KILO_PASSWORD` - Password for local Kilo (optional)

## Step 2: Build and Start

```bash
docker compose up -d --build
```

Check status:
```bash
docker compose ps
```

Expected:
```
NAME                   STATUS
simpleclaw-bot-1      healthy
simpleclaw-kilo-1      healthy
simpleclaw-simplex-1   healthy
```

## Step 3: Verify Services

```bash
# Check bot health
curl http://localhost:8080/health

# Check Kilo health
curl http://localhost:4096/global/health

# Check containers
docker compose ps
```

## Step 4: Get Bot Address

```bash
docker compose logs simpleclaw-bot-1 | grep -i "address"
```

The output contains a SimpleX address like:
```
sm://abcdef...@smp.simplex.im,smp5.simplex.im
```

Tell the user to copy this address and add as contact in SimpleX Chat.

## Step 5: First Connection

When a user connects via SimpleX Chat:
1. Bot auto-accepts the contact request
2. Bot sends greeting: "Hello! I'm SimpleClaw..."
3. Bot creates a new Kilo session for that user

## Troubleshooting Workflow

**If something fails, systematically work through these:**

### Problem: Container won't start

```bash
# 1. Check for port conflicts
ss -tlnp | grep -E "8080|4096|5225"

# 2. Rebuild from scratch
docker compose down -v
docker compose up -d --build

# 3. Check logs for specific errors
docker compose logs --tail=100
```

### Problem: Bot not responding to messages

```bash
# 1. Check if messages are being received
docker compose logs simpleclaw-bot-1 | grep "Incoming message"

# 2. Check if Kilo is responding
docker compose logs simpleclaw-bot-1 | grep "Session created"

# 3. Check Kilo health
curl http://localhost:4096/global/health

# 4. Test Kilo API directly
SESSION=$(curl -s -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"directory":"/workspace"}')
echo $SESSION
```

### Problem: SimpleX connection issues

```bash
# 1. Check SimpleX logs
docker compose logs simpleclaw-simplex-1 --tail=50

# 2. Verify WebSocket is accessible from bot
docker compose exec simpleclaw-bot-1 wget -q -O - http://simpleclaw-simplex-1:5225 || echo "WS not reachable"

# 3. Restart SimpleX
docker compose restart simpleclaw-simplex-1
```

### Problem: Kilo API errors (404 or empty responses)

The local Kilo API uses these endpoints:
- `POST /session` - Create session (returns JSON with `id`)
- `POST /session/{id}/prompt_async` - Send prompt (returns 204 empty)
- `GET /session/{id}/message` - Get messages (returns JSON array)

```bash
# 1. Test session creation
curl -s -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"directory":"/workspace"}'

# 2. Test prompt (replace SESSION_ID)
curl -s -X POST "http://localhost:4096/session/SESSION_ID/prompt_async" \
  -H "Content-Type: application/json" \
  -d '{"parts":[{"type":"text","text":"test","metadata":{"role":"user"}}]}'

# 3. Check messages
curl -s "http://localhost:4096/session/SESSION_ID/message"
```

### Problem: Contact request not accepted

Bot should auto-accept contact requests. Check logs:
```bash
docker compose logs simpleclaw-bot-1 | grep -E "Contact request|accepting"
```

## Common Fixes

| Problem | Solution |
|---------|----------|
| Container won't start | `docker compose down -v && docker compose up -d --build` |
| Bot not responding | `docker compose restart simpleclaw-bot-1` |
| Kilo 404 errors | Bot uses wrong API path - rebuild or check endpoint |
| SimpleX errors | `docker compose restart simpleclaw-simplex-1` |

## Quick Reference

| Action | Command |
|--------|---------|
| Start all | `docker compose up -d --build` |
| Stop all | `docker compose down` |
| View all logs | `docker compose logs -f` |
| View bot logs | `docker compose logs -f simpleclaw-bot-1` |
| Check health | `curl http://localhost:8080/health` |
| Restart bot | `docker compose restart simpleclaw-bot-1` |
| Rebuild all | `docker compose down && docker compose up -d --build` |

## Port Reference

| Port | Service | Description |
|------|---------|-------------|
| 8080 | Bot | Health check endpoint |
| 4096 | Kilo | Local Kilo API |
| 5225 | SimpleX | SimpleX WebSocket |
| 5224 | SimpleX | SimpleX messaging |

## After Successful Setup

Tell the user to:
1. Connect via SimpleX Chat using the bot address
2. Edit `core/USER.md` with their profile
3. Edit `core/CLAW.md` to customize principles
4. Start chatting with their memory bot!

---

*Last updated: 2026-03-30*
