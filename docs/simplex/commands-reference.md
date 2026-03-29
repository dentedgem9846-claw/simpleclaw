# SimpleX Bot Commands Reference

Source: https://github.com/simplex-chat/simplex-chat/blob/master/bots/api/COMMANDS.md

## Send Messages

### APISendMessages
Send messages to contact or group.
```
/_send <chatRef>[ live=on][ ttl=<ttl>] json <json(composedMessages)>
```

Example (send text to contact):
```json
{
  "corrId": "msg-001",
  "cmd": "/_send @<contactId> json [{\"msgContent\":{\"text\":\"Hello!\"}}]"
}
```

Response:
```json
{
  "corrId": "msg-001",
  "resp": {
    "type": "newChatItems",
    "chatItems": [...]
  }
}
```

## Address Management

### APICreateMyAddress
Create bot address for users to connect.
```
/_address <userId>
```

Response:
```json
{
  "type": "userContactLinkCreated",
  "user": {...},
  "connLinkContact": {
    "connLink": "https://simplex.chat/contact#..."
  }
}
```

### APIShowMyAddress
Get existing bot address.
```
/_show_address <userId>
```

### APISetAddressSettings
Set address settings (enable auto-accept).
```
/_address_settings <userId> <json(settings)>
```

Settings:
```json
{
  "autoAccept": true
}
```

## Contact Management

### APIListContacts
Get all contacts.
```
/_contacts <userId>
```

Response:
```json
{
  "type": "contactsList",
  "contacts": [...]
}
```

### APIAcceptContact
Accept incoming contact request.
```
/_accept <contactReqId>
```

## Message Reference

### ChatRef Format
- Contact: `@<contactId>`
- Group: `#<groupId>`

### ComposedMessage Format
```json
{
  "msgContent": {
    "text": "message text"
  }
}
```

Or for multiple messages:
```json
[
  {"msgContent": {"text": "First message"}},
  {"msgContent": {"text": "Second message"}}
]
```

## Key Commands Summary

| Command | Purpose |
|---------|---------|
| `/_send @<id> json [...]` | Send message to contact |
| `/_send #<id> json [...]` | Send message to group |
| `/_address <userId>` | Create bot address |
| `/_show_address <userId>` | Show bot address |
| `/_address_settings <userId> <json>` | Configure address |
| `/_contacts <userId>` | List contacts |
| `/_accept <reqId>` | Accept contact request |
| `/_delete <chatRef>` | Delete chat |
