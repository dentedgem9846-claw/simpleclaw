# SimpleX Bot Events Reference

Source: https://github.com/simplex-chat/simplex-chat/blob/master/bots/api/EVENTS.md

## Message Events (Primary)

### NewChatItems
Received message(s).
```typescript
{
  type: "newChatItems",
  user: User,
  chatItems: AChatItem[]
}
```

### ChatItemReaction
Received message reaction.
```typescript
{
  type: "chatItemReaction",
  user: User,
  added: boolean,
  reaction: ACIReaction
}
```

### ChatItemsDeleted
Message was deleted by another user.
```typescript
{
  type: "chatItemsDeleted",
  user: User,
  chatItemDeletions: ChatItemDeletion[],
  byUser: boolean,
  timed: boolean
}
```

## Contact Events

### ContactConnected
After a user connects via bot SimpleX address.
```typescript
{
  type: "contactConnected",
  user: User,
  contact: Contact,
  userCustomProfile: Profile?
}
```

### ContactSndReady
After accepting invitation - bot can send messages.
```typescript
{
  type: "contactSndReady",
  user: User,
  contact: Contact
}
```

### ReceivedContactRequest
Contact request received (when auto-accept disabled).
```typescript
{
  type: "receivedContactRequest",
  user: User,
  contactRequest: UserContactRequest,
  chat_: AChat?
}
```

### ContactDeletedByContact
Connection with contact deleted.
```typescript
{
  type: "contactDeletedByContact",
  user: User,
  contact: Contact
}
```

## Network Events

### HostConnected
Messaging or file server connected.
```typescript
{
  type: "hostConnected",
  protocol: string,
  transportHost: string
}
```

### HostDisconnected
Messaging or file server disconnected.
```typescript
{
  type: "hostDisconnected",
  protocol: string,
  transportHost: string
}
```

## Error Events

### MessageError
Message error.
```typescript
{
  type: "messageError",
  user: User,
  severity: string,
  errorMessage: string
}
```

### ChatError
Chat error (WebSockets API only).
```typescript
{
  type: "chatError",
  chatError: ChatError
}
```

## Key Types

### User
```typescript
interface User {
  userId: number;
  profile: Profile;
}
```

### Contact
```typescript
interface Contact {
  contactId: number;
  localDisplayName: string;
  profile: Profile;
  // ... more fields
}
```

### AChatItem
```typescript
interface AChatItem {
  chatDir: {
    contact?: { contactId: number };
    group?: { groupId: number };
  };
  chatItem: {
    itemId: number;
    content: {
      msgContent?: {
        text: string;  // The actual message text
      };
    };
    createdAt: number;
    // ...
  };
}
```
