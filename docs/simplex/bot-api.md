# SimpleX Chat Bot API Documentation

Source: https://github.com/simplex-chat/simplex-chat/blob/master/bots/README.md

## What is SimpleX Bot

SimpleX bot is a participant of SimpleX network. Bot can do everything that a usual SimpleX Chat user can do – send and receive messages and files, connect to addresses and join groups, etc.

## How to Create a Bot

### 1. Start SimpleX CLI as WebSocket Server

```bash
simplex-chat -p 5225
```

The CLI binds to localhost only for security. To see all options:
```bash
simplex-chat -h
```

### 2. Bot Communication Format

**Sending Commands:**
```json
{
  "corrId": "<unique string>",
  "cmd": "<command string>"
}
```

**Receiving Responses:**
```json
{
  "corrId": "<corrId sent with command>",
  "resp": {
    "type": "<response record tag>",
    "other fields": null
  }
}
```

**Receiving Events:**
```json
{
  "resp": {
    "type": "<event record tag>",
    "other event fields": null
  }
}
```

### 3. Key Commands

- `apiCreateProfile <displayName> [<fullName>]` - Create user profile
- `apiCreateAddress` - Create contact address
- `apiConnect <invitation>` - Accept connection
- `apiSendMessage <contactRef> <content>` - Send message
- `apiGetMessages <contactRef>` - Get messages

### 4. Key Events

- `NewChatItems` - Received messages
- `ChatItemSent` - Sent confirmation
- `ContactRequest` - Incoming connection request
- `ConnectionDeleted` - Contact removed

## Bot Configuration

### Set Up Bot Profile

Commands to configure bot:
```
/create bot [files=on] <name>[ <bio>]
```

### Configure Bot Commands

```
/set bot commands '<label>':/'<keyword>[ <params>]'
```

Example:
```
/set bot commands 'Help':/help,'Status':/status
```

## Security Considerations

- WebSocket API has NO authentication
- CLI binds only to localhost
- Messages are NOT encrypted in WebSocket
- Run bot on same machine as CLI for security
- If remote: use TLS proxy (Caddy/Nginx) + HTTP basic auth

## Available Libraries

- **Official TypeScript SDK**: `npm i @simplex-chat/webrtc-client@6.5.0-beta.3`
- **Rust SDK**: `crates.io/crates/simploxide-client`

## Quick Start Example

1. Start CLI: `simplex-chat -p 5225 -d test_db`
2. Install SDK: `npm i @simplex-chat/webrtc-client@6.5.0-beta.3`
3. Build: `npm run build`
4. Run example: `node examples/squaring-bot`
5. Connect via SimpleX app using bot's address

## Official TypeScript Client API

Source: https://github.com/simplex-chat/simplex-chat/tree/master/packages/simplex-chat-client/typescript

See `client.ts` for available types and functions:
- Create/change user profile
- Create/accept invitations
- Manage long-term addresses
- Create/join/manage groups
- Send/receive files
