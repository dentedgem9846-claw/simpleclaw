# SimpleClaw Setup Guide

*A complete workflow for setting up SimpleClaw with Docker, SimpleX Chat, and Kilo AI.*

---

## Prerequisites

- Docker and Docker Compose installed
- A Kilo API key from https://app.kilo.ai/
- Git (for cloning)

---

## Step 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/dentedgem9846-claw/simpleclaw.git
cd simpleclaw

# Copy environment template
cp .env.example .env
```

### Configure Environment

Edit `.env` with your settings:

```bash
# Required: Kilo API key
KILO_API_KEY=klo_your_api_key_here

# Optional: SimpleX WebSocket URL (default: ws://localhost:5225)
# SIMPLEX_WS_URL=ws://localhost:5225

# Optional: Bot data directory (default: /app/data)
# BOT_DATA_DIR=/app/data
```

---

## Step 2: Build and Start

```bash
# Build and start all containers
docker-compose up -d --build

# Check container status
docker-compose ps
```

Expected output:
```
NAME                    STATUS
simpleclaw-bot-1        running (healthy)
simpleclaw-kilo-1       running (healthy)  
simpleclaw-simplex-1    running (healthy)
```

---

## Step 3: Verify Services

### Check Bot Health
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### Check Kilo Health
```bash
docker-compose logs kilo-1 | grep -i "healthy"
```

### Check SimpleX Logs
```bash
docker-compose logs simplex-chat-1 | tail -5
# Should show: "Starting SimpleX CLI in API mode..."
```

---

## Step 4: Get Bot Address

```bash
# Get the connection address
docker-compose logs simpleclaw-bot-1 | grep -i "connLink\|address\|link"

# Or query the database directly
docker-compose exec simpleclaw-simplex-1 sqlite3 /home/simplex/.simplex/simplex_v1_chat.db \
  "SELECT conn_link FROM user_contact_links WHERE local_display_name != 'SimpleClaw' LIMIT 1;"
```

---

## Step 5: Connect via SimpleX Chat

1. Install [SimpleX Chat](https://simplex.chat/) (mobile or desktop)
2. Add contact → Enter connection address
3. Paste the `simplex:/...` address from Step 4
4. Send a message to the bot

---

## Troubleshooting Workflow

**If something fails, work through these steps:**

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

# 3. Test WebSocket connection manually
docker exec simpleclaw-bot-1 node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://simpleclaw-simplex-1:5225');
ws.on('open', () => console.log('Connected'));
ws.on('message', (d) => console.log('Received:', d.toString().substring(0, 200)));
"
```

### Problem: SimpleX send command fails

```bash
# 1. Verify simplex-chat is running
docker-compose exec simplex-chat-1 ps aux | grep simplex

# 2. Test SimpleX CLI directly
docker exec simpleclaw-simplex-1 simplex-chat -p 5226 /users

# 3. Check contacts list
docker exec simpleclaw-bot-1 node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://simpleclaw-simplex-1:5225');
ws.on('open', () => {
  ws.send(JSON.stringify({corrId: 'test', cmd: '/users'}));
});
ws.on('message', (d) => {
  console.log(d.toString().substring(0, 500));
  ws.close();
});
"

# 4. If commands work but send doesn't:
#    - Check the command format is: @'displayName' message text
#    - NOT: /_send @contactId json [...]
```

### Problem: Kilo API errors

```bash
# 1. Test Kilo Cloud API directly
curl -X POST https://api.kilo.ai/api/gateway/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KILO_API_KEY" \
  -d '{"model":"kilo-auto/free","messages":[{"role":"user","content":"test"}]}'

# 2. Check Kilo container logs
docker-compose logs kilo-1

# 3. Verify API key is set
docker-compose exec kilo-1 env | grep KILO
```

### Problem: "Failed reading: empty" error

This means SimpleX CLI doesn't recognize the command:

```bash
# 1. Try basic commands first
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
#    /send @contactId message
```

---

## Common Fixes

### Restart everything
```bash
docker-compose restart
```

### Clear and rebuild
```bash
docker-compose down
docker system prune -f
docker-compose up -d --build
```

### View real-time logs
```bash
docker-compose logs -f
```

### Access databases
```bash
# Bot memory database
docker-compose exec bot-1 sqlite3 /app/data/bot.db

# SimpleX chat database  
docker-compose exec simplex-chat-1 sqlite3 /home/simplex/.simplex/simplex_v1_chat.db
```

---

## Architecture Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│  SimpleX Chat (your phone/desktop)                          │
│  Add contact → simplex:/address                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ WebSocket
┌─────────────────────────────────────────────────────────────┐
│  simpleclaw-simplex-1 (Docker)                              │
│  simplex-chat CLI + socat proxy                              │
│  Port 5225 (external) → 5226 (internal)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ WebSocket :5225
┌─────────────────────────────────────────────────────────────┐
│  simpleclaw-bot-1 (Docker)                                   │
│  Receives messages, processes with AI, sends replies         │
│  Port 8080 (health check)                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│  api.kilo.ai (Kilo Cloud)                                  │
│  AI processing via gateway                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Commands Reference

| Action | Command |
|--------|---------|
| Start all | `docker-compose up -d --build` |
| Stop all | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Bot logs | `docker-compose logs -f bot-1` |
| Check health | `curl http://localhost:8080/health` |
| Restart bot | `docker-compose restart bot-1` |
| Shell into bot | `docker exec -it simpleclaw-bot-1 sh` |
| Shell into simplex | `docker exec -it simpleclaw-simplex-1 sh` |

---

## Next Steps

1. Edit `core/USER.md` with your profile
2. Edit `core/CLAW.md` to customize principles
3. Start chatting with your memory bot!

---

*Last updated: 2026-03-29*
