// SimpleX types sourced from docs/simplex/events-reference.md

export interface User {
  userId: number;
  profile: Profile;
}

export interface Profile {
  displayName: string;
  fullName?: string;
}

export interface Contact {
  contactId: number;
  localDisplayName: string;
  profile: Profile;
}

export interface AChatItem {
  chatDir: {
    contact?: { contactId: number };
    group?: { groupId: number };
  };
  chatItem: {
    itemId: number;
    content: {
      msgContent?: {
        text: string;
      };
    };
    createdAt: number;
  };
}

export interface NewChatItemsEvent {
  type: 'newChatItems';
  user: User;
  chatItems: AChatItem[];
}

export interface ContactConnectedEvent {
  type: 'contactConnected';
  user: User;
  contact: Contact;
  userCustomProfile?: Profile;
}

export interface ContactSndReadyEvent {
  type: 'contactSndReady';
  user: User;
  contact: Contact;
}

export interface UserContactLinkCreatedResponse {
  type: 'userContactLinkCreated';
  user: User;
  connLinkContact: {
    connLink: string;
  };
}

export interface UserContactLinkResponse {
  type: 'userContactLink';
  user: User;
  contactLink: {
    connLinkContact: {
      connLink: string;
    };
  };
}

export interface ContactsListResponse {
  type: 'contactsList';
  contacts: Contact[];
}

export interface ChatErrorEvent {
  type: 'chatError';
  chatError: { errorType: string };
}

export interface ContactRequest {
  contactRequestId: number;
  localDisplayName: string;
  profile: Profile;
}

export interface ReceivedContactRequestEvent {
  type: 'receivedContactRequest';
  user: User;
  contactRequest: ContactRequest;
}

export type SimplexEvent =
  | NewChatItemsEvent
  | ContactConnectedEvent
  | ContactSndReadyEvent
  | ReceivedContactRequestEvent
  | { type: string; [key: string]: unknown };

export type SimplexResponse =
  | UserContactLinkCreatedResponse
  | UserContactLinkResponse
  | ContactsListResponse
  | { type: 'newChatItems'; chatItems: AChatItem[] }
  | { type: string; [key: string]: unknown };

export interface ParsedMessage {
  corrId?: string;
  resp: SimplexEvent | SimplexResponse;
}
