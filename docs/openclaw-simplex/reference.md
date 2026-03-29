# OpenClaw SimpleX Plugin Reference

Source: https://github.com/dangoldbj/openclaw-simplex

## Overview

This plugin enables OpenClaw agents to communicate over SimpleX:
- No phone numbers required
- End-to-end encrypted
- Self-hosted or local-first
- No third-party dependencies

## Architecture

```
OpenClaw <-> Plugin <-> SimpleX CLI <-> SimpleX Network
```

Plugin responsibilities:
- Inbound monitor (receive messages)
- Outbound actions (send messages)
- Policy enforcement (dmPolicy, allowFrom)
- Account/runtime state management

## Installation

### 1. Install SimpleX CLI
```bash
curl -o- https://raw.githubusercontent.com/simplex-chat/simplex-chat/stable/install.sh | bash
```

### 2. Install Plugin
```bash
npm i @dangoldbj/openclaw-simplex
```

### 3. Enable in OpenClaw
```bash
openclaw plugins install @dangoldbj/openclaw-simplex
openclaw plugins enable simplex
```

## Configuration

### Managed Mode (OpenClaw runs SimpleX)

```json
{
  "channels": {
    "simplex": {
      "enabled": true,
      "connection": {
        "mode": "managed",
        "cliPath": "simplex-chat",
        "wsHost": "127.0.0.1",
        "wsPort": 5225
      },
      "allowFrom": ["*"]
    }
  }
}
```

### External Mode (You run SimpleX)

```json
{
  "channels": {
    "simplex": {
      "enabled": true,
      "connection": {
        "mode": "external",
        "wsUrl": "ws://127.0.0.1:5225"
      },
      "allowFrom": ["*"]
    }
  }
}
```

## Key Source Files

- `src/simplex-cli.ts` - CLI process management (spawn, stop, restart)
- `src/simplex-ws-client.ts` - WebSocket communication
- `src/channel.ts` - Plugin integration (handles events, sends responses)
- `src/types.ts` - TypeScript types
- `src/config-schema.ts` - Configuration schema

## Managed Mode Features

From `simplex-cli.ts`:
- Auto-spawn simplex-chat process
- Port configuration
- Data directory management
- CLI output logging
- Graceful shutdown (SIGINT -> SIGTERM -> SIGKILL)

## Security

- `dmPolicy` - DM access policy (pairing, allowlist, open)
- `allowFrom` - Allowed sender list
- `groupPolicy` - Group access policy
- No reliance on external messaging APIs

## Commands

```bash
openclaw plugins list
openclaw plugins info simplex
openclaw channels add --channel simplex --cli-path simplex-chat
openclaw pairing list
```

## Invite APIs

- `simplex.invite.create`
- `simplex.invite.list`
- `simplex.invite.revoke`

## Troubleshooting

- Plugin not visible: Check `plugins.allow` and `openclaw plugins list`
- Channel not starting: Verify `channels.simplex.connection` exists
- `Configured No`: Add explicit connection config
- Inbound issues: Review `allowFrom`, `dmPolicy`, group policy
