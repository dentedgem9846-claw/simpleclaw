# SimpleClaw Bot Documentation

This folder contains reference documentation for building the SimpleClaw bot that connects SimpleX messaging to Kilo Code AI.

## Documentation Index

### Architecture
- [Architecture Overview](ARCHITECTURE.md) - 3 separate container types, scalable design

### Docker
- [Docker Setup](docker-setup.md) - Custom Dockerfiles for simplex-chat and Kilo
- [Implementation Plan](IMPLEMENTATION-PLAN.md) - Complete build plan

### SimpleX
- [Bot API](simplex/bot-api.md) - How to create bots that connect to SimpleX Chat
- [CLI Reference](simplex/cli.md) - SimpleX Chat terminal app commands
- [Events Reference](simplex/events-reference.md) - JSON event types
- [Commands Reference](simplex/commands-reference.md) - WebSocket commands

### Kilo Code
- [HTTP API Reference](kilo/http-api.md) - Kilo Code HTTP API for AI processing

### OpenClaw SimpleX Plugin
- [Reference](openclaw-simplex/reference.md) - Reference implementation (inspiration only)

## Quick Links

| Document | Purpose |
|----------|---------|
| IMPLEMENTATION-PLAN.md | Master plan with all phases |
| simplex/bot-api.md | SimpleX bot integration |
| kilo/http-api.md | Kilo AI API |
| openclaw-simplex/reference.md | Similar project reference |

## Architecture Summary

```
SimpleX Network → simplex-chat CLI → simpleclaw-bot → Kilo Code
                         ↓
                    WebSocket :5225
                    
simpleclaw-bot ← Kilo HTTP API :4096
     ↓
SQLite Memory + Markdown Zettels
```

## Key APIs

### SimpleX (simplex-chat)
```bash
simplex-chat -p 5225  # Start WebSocket server
```

### Kilo Code (kilo serve)
```bash
kilo serve --port 4096  # Start HTTP API
POST /session  # Create session
POST /session/{id}/chat  # Send message
GET /event  # SSE events
```

## External Resources

- SimpleX GitHub: https://github.com/simplex-chat/simplex-chat
- Kilo Code GitHub: https://github.com/Kilo-Org/kilocode
- OpenClaw SimpleX: https://github.com/dangoldbj/openclaw-simplex
