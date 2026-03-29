# SimpleX Bot Integration - Key Learnings

## Command Format

SimpleX Chat CLI WebSocket API has a specific command format that differs from the bot API documentation:

### Correct Format for Sending Messages
```typescript
// Plain text format - NO JSON, NO /_send prefix
const cmd = `@'displayName' Your message text here`;
await sendCommand(cmd);
```

### Wrong Formats (that don't work)
```typescript
// ❌ JSON format from bot API docs
const cmd = `/_send @${contactId} json [{"msgContent":{"text":"Hello"}}]`;

// ❌ Simple command without name
const cmd = `/_send @${contactId} Hello`;
```

## Why This Matters

1. **Two APIs exist**: The SimpleX desktop/app API uses `/command args json [...]` format
2. **CLI/WebSocket uses different syntax**: Plain text with `@'name' message` format
3. **Documentation mismatch**: The official bot API docs show JSON format, but the CLI expects plain text

## Connection Details

- SimpleX CLI runs on internal port (e.g., 5226)
- socat proxies external port (e.g., 5225) to internal port
- WebSocket connects to external port via Docker network

## Sending Messages - Step by Step

1. Connect WebSocket to `ws://simpleclaw-simplex-1:5225`
2. Receive messages via `newChatItems` events (no corrId - broadcast)
3. Extract `contactId` and `localDisplayName` from event
4. Send reply using: `@'${displayName}' ${messageText}`

## Key Code Pattern

```typescript
// Receiving (from event)
const contactId = event.chatItems[0].chatInfo.contact.contactId;
const displayName = event.chatItems[0].chatInfo.contact.localDisplayName;
const text = event.chatItems[0].chatItem.content.msgContent.text;

// Sending (plain text)
const cmd = `@'${displayName}' ${responseText}`;
await sendCommand(cmd);
```

## Other Working Commands

```typescript
// List users - WORKS
await sendCommand('/users');

// List contacts - WORKS  
await sendCommand('/_contacts 1');

// Show active user - WORKS
await sendCommand('/user');

// Create/show address - WORKS
await sendCommand('/address');
await sendCommand('/address create');
```

## Non-Working Commands

```typescript
// /_send with JSON - FAILS
await sendCommand('/_send @9 json [...]');

// /start command - FAILS (may require different context)

// apiSendMessage - FAILS (CLI doesn't recognize this)
```

## Database Query for Debugging

```sql
-- Get contacts
SELECT contact_id, local_display_name FROM contacts;

-- Get connections  
SELECT conn_id, contact_id, conn_status FROM connections WHERE conn_status = 'ready';

-- Get messages
SELECT chat_item_id, item_text, item_sent FROM chat_items WHERE item_text IS NOT NULL;
```

## Lesson Summary

When integrating with SimpleX Chat via WebSocket:
1. Use plain text format: `@'name' message`
2. Do NOT use JSON payload format shown in bot API docs
3. Events come as broadcasts (no corrId)
4. Responses to commands have corrId for correlation
