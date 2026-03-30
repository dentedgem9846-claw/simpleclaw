---
description: Set up SimpleClaw from scratch or troubleshoot existing installation
agent: simpleclaw
---

You are setting up SimpleClaw, a personal memory system with SimpleX Chat bot interface.

## Prerequisites Check

Verify the user has:
- Docker and Docker Compose installed
- A Kilo API key from https://app.kilo.ai/

If missing, tell them how to install:
- Docker: https://docs.docker.com/get-docker/
- Kilo API key: https://app.kilo.ai/

## Step 1: Clone and Configure

```bash
git clone https://github.com/dentedgem9846-claw/simpleclaw.git
cd simpleclaw
cp .env.example .env
```

Tell the user to edit `.env` and add their `KILO_API_KEY`.

## Step 2: Build and Start

```bash
docker-compose up -d --build
```

Check status:
```bash
docker-compose ps
```

Expected: All containers running.

## Step 3: Verify Services

```bash
# Check bot health
curl http://localhost:8080/health

# Check containers
docker-compose ps
```

## Step 4: Get Bot Address

```bash
docker-compose logs simpleclaw-bot-1 | grep -i "address"
```

Tell the user this address to connect via SimpleX Chat.

## Troubleshooting Workflow

**If something fails, systematically work through these:**

### Problem: Container won't start

```bash
# 1. Check for port conflicts
netstat -tlnp | grep -E "8080|4096|5225"

# 2. Rebuild from scratch
docker-compose down -v
docker-compose up -d --build

# 3. Check logs for specific errors
docker-compose logs --tail=50
```

### Problem: Bot not responding to messages

```bash
# 1. Check if messages are being received
docker-compose logs bot-1 | grep "Incoming message"

# 2. Check if responses are being sent
docker-compose logs bot-1 | grep "Response sent"

# 3. Test WebSocket connection
docker exec simpleclaw-bot-1 node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://simpleclaw-simplex-1:5225');
ws.on('open', () => console.log('Connected'));
ws.on('message', (d) => console.log('Received:', d.toString().substring(0, 200)));
"
```

### Problem: SimpleX "Failed reading: empty" error

This means SimpleX CLI doesn't recognize the command.

```bash
# 1. Test basic commands
docker exec simpleclaw-bot-1 node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://simpleclaw-simplex-1:5225');
ws.on('open', () => ws.send(JSON.stringify({corrId: '1', cmd: '/users'})));
ws.on('message', (d) => {
  const r = JSON.parse(d);
  console.log('Type:', r.resp?.type);
  if (r.resp?.type === 'chatCmdError') console.log('Error:', JSON.stringify(r.resp.chatError));
  ws.close();
});
"

# 2. Working command format for sending messages:
#    @'contactDisplayName' Your message here

# 3. NOT working formats:
#    /_send @contactId json [...]
#    apiSendMessage @contactId text:message
```

### Problem: Kilo API errors

```bash
# 1. Test Kilo Cloud API directly
curl -X POST https://api.kilo.ai/api/gateway/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KILO_API_KEY" \
  -d '{"model":"kilo-auto/free","messages":[{"role":"user","content":"test"}]}'

# 2. Check container logs
docker-compose logs kilo-1

# 3. Verify API key is set
docker-compose exec kilo-1 env | grep KILO
```

## Common Fixes

| Problem | Solution |
|---------|----------|
| Container won't start | `docker-compose down -v && docker-compose up -d --build` |
| Bot not responding | `docker-compose restart bot-1` |
| SimpleX errors | Check command format is `@'name' message` not JSON |
| Kilo errors | Verify API key in `.env` and test with curl |

## Quick Reference

| Action | Command |
|--------|---------|
| Start all | `docker-compose up -d --build` |
| Stop all | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Check health | `curl http://localhost:8080/health` |
| Restart bot | `docker-compose restart bot-1` |

## After Successful Setup

Tell the user to:
1. Connect via SimpleX Chat using the bot address
2. Edit `core/USER.md` with their profile
3. Edit `core/CLAW.md` to customize principles
4. Start chatting with their memory bot!

---

*Last updated: 2026-03-29*
