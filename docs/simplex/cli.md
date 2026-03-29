# SimpleX CLI Documentation

Source: https://github.com/simplex-chat/simplex-chat/blob/master/docs/CLI.md

## Installation

### Linux/MacOS
```bash
curl -o- https://raw.githubusercontent.com/simplex-chat/simplex-chat/stable/install.sh | bash
```

### Windows
Download binary from releases and run.

## Running

```bash
# Default (uses ~/.simplex for data)
simplex-chat

# Custom data directory
simplex-chat -d mybot

# WebSocket server mode (for bot integration)
simplex-chat -p 5225

# Via Tor
simplex-chat -x
```

## Key Commands (in chat)

- `/c [invitation]` - Connect to contact
- `/c` - Create invitation
- `/ad` - Create long-term address
- `/g <name>` - Create group
- `/a <group> <name>` - Add to group
- `/f @<contact> <file>` - Send file
- `/help` - All commands
- `/help groups` - Group commands
- `/help address` - Address commands
- `/help files` - File commands

## Addressing

- `@<name> <message>` - Send to contact
- `#<group> <message>` - Send to group
- Direct message input - Reply to last sender

## Database

Two SQLite databases created:
- `simplex_v1_chat.db` - Chat messages
- `simplex_v1_agent.db` - Agent data

## Security

- No global identity
- Double-ratchet E2E encryption
- Random keys per contact (not identity)
- TLS 1.3 transport
