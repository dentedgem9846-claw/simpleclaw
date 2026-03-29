import { describe, expect, it } from 'vitest';
import type {
  ContactConnectedEvent,
  NewChatItemsEvent,
  ReceivedContactRequestEvent,
  UserContactLinkCreatedResponse,
  UserContactLinkResponse,
} from './types.js';

describe('SimpleX type shapes', () => {
  it('NewChatItemsEvent has required fields', () => {
    const event: NewChatItemsEvent = {
      type: 'newChatItems',
      user: { userId: 1, profile: { displayName: 'Bot' } },
      chatItems: [
        {
          chatDir: { contact: { contactId: 10 } },
          chatItem: {
            itemId: 1,
            content: { msgContent: { text: 'hello' } },
            createdAt: 0,
          },
        },
      ],
    };
    expect(event.chatItems[0].chatDir.contact?.contactId).toBe(10);
    expect(event.chatItems[0].chatItem.content.msgContent?.text).toBe('hello');
  });

  it('ContactConnectedEvent has contact fields', () => {
    const event: ContactConnectedEvent = {
      type: 'contactConnected',
      user: { userId: 1, profile: { displayName: 'Bot' } },
      contact: { contactId: 5, localDisplayName: 'Alice', profile: { displayName: 'Alice' } },
    };
    expect(event.contact.contactId).toBe(5);
  });

  it('ReceivedContactRequestEvent has contactRequest fields', () => {
    const event: ReceivedContactRequestEvent = {
      type: 'receivedContactRequest',
      user: { userId: 1, profile: { displayName: 'Bot' } },
      contactRequest: {
        contactRequestId: 99,
        localDisplayName: 'Bob',
        profile: { displayName: 'Bob' },
      },
    };
    expect(event.contactRequest.contactRequestId).toBe(99);
  });

  it('UserContactLinkCreatedResponse has connLink', () => {
    const resp: UserContactLinkCreatedResponse = {
      type: 'userContactLinkCreated',
      user: { userId: 1, profile: { displayName: 'Bot' } },
      connLinkContact: { connLink: 'simplex:/link' },
    };
    expect(resp.connLinkContact.connLink).toBe('simplex:/link');
  });

  it('UserContactLinkResponse has nested connLink', () => {
    const resp: UserContactLinkResponse = {
      type: 'userContactLink',
      user: { userId: 1, profile: { displayName: 'Bot' } },
      contactLink: { connLinkContact: { connLink: 'simplex:/link2' } },
    };
    expect(resp.contactLink.connLinkContact.connLink).toBe('simplex:/link2');
  });
});
