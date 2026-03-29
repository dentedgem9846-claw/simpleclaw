import fs from 'node:fs';
import path from 'node:path';
import type { KiloClient } from './kilo/client.js';
import type { SessionManager } from './kilo/session.js';
import type { KiloChatPart } from './kilo/types.js';
import { logger } from './logger.js';
import type { MemoryStore } from './memory/store.js';
import { encodeSendMessage, generateCorrId } from './simplex/protocol.js';
import type {
  ContactConnectedEvent,
  NewChatItemsEvent,
  ReceivedContactRequestEvent,
  SimplexEvent,
} from './simplex/types.js';
import type { SimplexWsClient } from './simplex/websocket.js';

const AGENTS_DIR = '/workspace/.kilo/agents';
const CORE_DIR = '/workspace/core';
const MAX_MESSAGE_LENGTH = 4_096;
const MAX_HISTORY_MESSAGES = 20;

/** Max messages per contact per window */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const HELP_TEXT = `SimpleClaw — Personal Knowledge Assistant

Commands:
  /help    Show this message
  /status  Check bot status

Just send a message to chat with your knowledge system.`;

function readFileOptional(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function loadSystemContext(): string {
  const clawMd = readFileOptional(path.join(CORE_DIR, 'CLAW.md'));
  const agentMd = readFileOptional(path.join(AGENTS_DIR, 'simpleclaw.md'));
  const userMd = readFileOptional(path.join(CORE_DIR, 'USER.md'));

  const parts: string[] = [];
  if (agentMd) parts.push(`## Agent Configuration\n${agentMd}`);
  if (clawMd) parts.push(`## System Context (CLAW.md)\n${clawMd}`);
  if (userMd) parts.push(`## User Profile (USER.md)\n${userMd}`);

  return parts.join('\n\n---\n\n');
}

function truncate(text: string, max = MAX_MESSAGE_LENGTH): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export class MessageLoop {
  private readonly simplex: SimplexWsClient;
  private readonly kilo: KiloClient;
  private readonly sessions: SessionManager;
  private readonly memory: MemoryStore;

  /** contactId -> timestamps of recent messages (for rate limiting) */
  private readonly rateLimitMap: Map<number, number[]> = new Map();

  constructor(
    simplex: SimplexWsClient,
    kilo: KiloClient,
    sessions: SessionManager,
    memory: MemoryStore
  ) {
    this.simplex = simplex;
    this.kilo = kilo;
    this.sessions = sessions;
    this.memory = memory;
  }

  start(): void {
    this.simplex.onEvent((event: SimplexEvent) => {
      logger.debug('loop', 'Raw event received', { type: event.type, event });
      const { type } = event;

      if (type === 'newChatItems') {
        void this.handleNewChatItems(event as NewChatItemsEvent);
      } else if (type === 'contactConnected') {
        void this.handleContactConnected(event as ContactConnectedEvent);
      } else if (type === 'receivedContactRequest') {
        void this.handleContactRequest(event as ReceivedContactRequestEvent);
      }
    });

    logger.info('loop', 'Message loop started');
  }

  isRateLimited(contactId: number): boolean {
    const now = Date.now();
    const timestamps = (this.rateLimitMap.get(contactId) ?? []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    timestamps.push(now);
    this.rateLimitMap.set(contactId, timestamps);
    return timestamps.length > RATE_LIMIT_MAX;
  }

  private async handleContactConnected(event: ContactConnectedEvent): Promise<void> {
    const { contact } = event;
    logger.info('loop', 'Contact connected', {
      contactId: contact.contactId,
      name: contact.localDisplayName,
    });

    this.memory.getOrCreateContact(contact.contactId, contact.localDisplayName);

    const greeting =
      "Hello! I'm SimpleClaw, your personal knowledge assistant. Send /help for available commands.";
    await this.sendToContact(contact.contactId, greeting);
  }

  private async handleContactRequest(event: ReceivedContactRequestEvent): Promise<void> {
    const { contactRequest } = event;
    logger.info('loop', 'Contact request received', {
      requestId: contactRequest.contactRequestId,
      name: contactRequest.localDisplayName,
    });

    try {
      await this.simplex.sendCommand(`/_accept ${contactRequest.contactRequestId}`);
      logger.info('loop', 'Contact request accepted', {
        requestId: contactRequest.contactRequestId,
      });
    } catch (err) {
      logger.error('loop', 'Failed to accept contact request', {
        requestId: contactRequest.contactRequestId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async handleNewChatItems(event: NewChatItemsEvent): Promise<void> {
    for (const chatItem of event.chatItems) {
      const chatInfo = (chatItem as unknown as { chatInfo: { contact?: { contactId: number } } }).chatInfo;
      const contactId = chatInfo?.contact?.contactId;
      if (!contactId) continue;

      const content = chatItem.chatItem.content;
      const text = (content as { msgContent?: { text?: string } }).msgContent?.text;
      if (!text) continue;

      logger.info('loop', 'Incoming message', {
        contactId,
        preview: text.slice(0, 80),
      });

      if (this.isRateLimited(contactId)) {
        logger.warn('loop', 'Rate limit exceeded', { contactId });
        await this.sendToContact(
          contactId,
          'You are sending messages too quickly. Please wait a moment.'
        );
        continue;
      }

      try {
        await this.processMessage(contactId, text, event.user.userId);
      } catch (err) {
        logger.error('loop', 'Error processing message', {
          contactId,
          error: err instanceof Error ? err.message : String(err),
        });
        await this.sendToContact(contactId, 'Sorry, I encountered an error. Please try again.');
      }
    }
  }

  async processMessage(simplexContactId: number, text: string, _userId: number): Promise<void> {
    const trimmed = text.trim();
    if (trimmed === '/help') {
      await this.sendToContact(simplexContactId, HELP_TEXT);
      return;
    }
    if (trimmed === '/status') {
      await this.sendToContact(simplexContactId, 'Bot is running and ready.');
      return;
    }

    const contact = this.memory.getOrCreateContact(simplexContactId);
    const contactId = contact.contact_id;

    this.memory.addMessage(contactId, 'user', truncate(text));

    const history = this.memory.getHistory(contactId, MAX_HISTORY_MESSAGES).reverse();

    const systemContext = loadSystemContext();
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (systemContext) {
      messages.push({ role: 'system', content: systemContext });
    }

    for (const msg of history.slice(0, -1)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: text });

    logger.debug('loop', 'Sending to Kilo', { contactId, messages: messages.length });

    const response = await this.kilo.chatWithMessages(messages);

    if (!response.trim()) {
      throw new Error('Kilo returned empty response');
    }

    const truncatedResponse = truncate(response);
    this.memory.addMessage(contactId, 'assistant', truncatedResponse);
    await this.sendToContact(simplexContactId, truncatedResponse);

    logger.info('loop', 'Response sent', {
      contactId: simplexContactId,
      responseLength: truncatedResponse.length,
    });
  }

  async sendToContact(contactId: number, text: string): Promise<void> {
    const corrId = generateCorrId();
    const displayName = this.getContactDisplayName(contactId);
    const cmd = `@'${displayName}' ${text}`;
    logger.debug('loop', 'Sending message', { contactId, displayName, cmd });
    try {
      const response = await this.simplex.sendCommand(cmd);
      logger.debug('loop', 'Send response', { contactId, response: JSON.stringify(response).slice(0, 200) });
    } catch (err) {
      logger.error('loop', 'Send error', { contactId, error: String(err) });
    }
  }

  private getContactDisplayName(contactId: number): string {
    const contact = this.memory.getOrCreateContact(contactId);
    return contact.display_name || String(contactId);
  }
}
