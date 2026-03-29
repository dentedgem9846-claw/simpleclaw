import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KiloClient } from './kilo/client.js';
import type { SessionManager } from './kilo/session.js';
import { MessageLoop } from './loop.js';
import type { MemoryStore } from './memory/store.js';
import type { ContactRecord } from './memory/store.js';
import type { SimplexWsClient } from './simplex/websocket.js';

function makeContact(id: number): ContactRecord {
  return {
    contact_id: `contact-${id}`,
    simplex_contact_id: id,
    kilo_session_id: null,
    display_name: null,
    first_seen: Date.now(),
    last_active: Date.now(),
  };
}

function makeDeps(overrides?: {
  kiloResponse?: string;
  sessionId?: string;
}) {
  const sessionId = overrides?.sessionId ?? 'sess-1';
  const kiloResponse = overrides?.kiloResponse ?? 'AI response';

  const simplex = {
    onEvent: vi.fn(),
    sendCommand: vi.fn().mockResolvedValue({ type: 'ok' }),
  } as unknown as SimplexWsClient;

  const kilo = {
    chat: vi.fn().mockResolvedValue(undefined),
    waitForResponse: vi.fn().mockResolvedValue(kiloResponse),
  } as unknown as KiloClient;

  const sessions = {
    getOrCreateSession: vi.fn().mockResolvedValue(sessionId),
  } as unknown as SessionManager;

  const memory = {
    getOrCreateContact: vi.fn((id: number) => makeContact(id)),
    getKiloSession: vi.fn().mockReturnValue(null),
    setKiloSession: vi.fn(),
    addMessage: vi.fn(),
    getHistory: vi.fn().mockReturnValue([]),
  } as unknown as MemoryStore;

  return { simplex, kilo, sessions, memory };
}

describe('MessageLoop', () => {
  describe('isRateLimited', () => {
    it('allows messages below the limit', () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      for (let i = 0; i < 10; i++) {
        expect(loop.isRateLimited(1)).toBe(false);
      }
    });

    it('blocks the 11th message within the window', () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      for (let i = 0; i < 10; i++) loop.isRateLimited(1);
      expect(loop.isRateLimited(1)).toBe(true);
    });

    it('tracks limits independently per contact', () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      for (let i = 0; i < 10; i++) loop.isRateLimited(1);
      expect(loop.isRateLimited(2)).toBe(false);
    });
  });

  describe('processMessage', () => {
    it('responds to /help without calling Kilo', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await loop.processMessage(1, '/help', 1);
      expect(kilo.chat).not.toHaveBeenCalled();
      expect(simplex.sendCommand).toHaveBeenCalledOnce();
    });

    it('responds to /status without calling Kilo', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await loop.processMessage(1, '/status', 1);
      expect(kilo.chat).not.toHaveBeenCalled();
    });

    it('calls Kilo and stores the response for normal messages', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await loop.processMessage(1, 'hello bot', 1);
      expect(kilo.chat).toHaveBeenCalledOnce();
      expect(memory.addMessage).toHaveBeenCalledWith('contact-1', 'user', 'hello bot');
      expect(memory.addMessage).toHaveBeenCalledWith('contact-1', 'assistant', 'AI response');
    });

    it('creates a Kilo session if none exists', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await loop.processMessage(1, 'test', 1);
      expect(sessions.getOrCreateSession).toHaveBeenCalledWith('1');
      expect(memory.setKiloSession).toHaveBeenCalledWith('contact-1', 'sess-1');
    });

    it('reuses an existing Kilo session from memory', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      vi.mocked(memory.getKiloSession).mockReturnValue('existing-session');
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await loop.processMessage(1, 'test', 1);
      expect(sessions.getOrCreateSession).not.toHaveBeenCalled();
    });

    it('truncates long messages to 4096 chars', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      const longText = 'x'.repeat(5000);
      await loop.processMessage(1, longText, 1);
      const [, , stored] = vi.mocked(memory.addMessage).mock.calls[0] as [string, string, string];
      expect(stored.length).toBe(4096);
      expect(stored.endsWith('...')).toBe(true);
    });

    it('throws when Kilo returns empty response', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps({ kiloResponse: '   ' });
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await expect(loop.processMessage(1, 'test', 1)).rejects.toThrow(
        'Kilo returned empty response'
      );
    });
  });

  describe('sendToContact', () => {
    it('issues a /_send command via simplex', async () => {
      const { simplex, kilo, sessions, memory } = makeDeps();
      const loop = new MessageLoop(simplex, kilo, sessions, memory);
      await loop.sendToContact(7, 'hi there');
      const cmd = vi.mocked(simplex.sendCommand).mock.calls[0]?.[0] as string;
      expect(cmd).toMatch(/^\/_send @7 json /);
    });
  });
});
