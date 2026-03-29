import { afterEach, describe, expect, it } from 'vitest';
import { MemoryStore } from './store.js';

/** Use an in-memory database for tests */
function makeStore(): MemoryStore {
  return new MemoryStore(':memory:');
}

describe('MemoryStore', () => {
  let store: MemoryStore;

  afterEach(() => {
    store.close();
  });

  describe('getOrCreateContact', () => {
    it('creates a new contact on first call', () => {
      store = makeStore();
      const c = store.getOrCreateContact(42, 'Alice');
      expect(c.simplex_contact_id).toBe(42);
      expect(c.display_name).toBe('Alice');
      expect(c.kilo_session_id).toBeNull();
      expect(c.contact_id).toBe('contact-42');
    });

    it('returns the same contact on second call', () => {
      store = makeStore();
      const a = store.getOrCreateContact(10);
      const b = store.getOrCreateContact(10);
      expect(a.contact_id).toBe(b.contact_id);
    });

    it('updates display_name on second call if provided', () => {
      store = makeStore();
      store.getOrCreateContact(7);
      const c = store.getOrCreateContact(7, 'Bob');
      expect(c.display_name).toBe('Bob');
    });
  });

  describe('kilo session', () => {
    it('returns null when no session is set', () => {
      store = makeStore();
      store.getOrCreateContact(1);
      expect(store.getKiloSession('contact-1')).toBeNull();
    });

    it('stores and retrieves a kilo session id', () => {
      store = makeStore();
      store.getOrCreateContact(1);
      store.setKiloSession('contact-1', 'session-xyz');
      expect(store.getKiloSession('contact-1')).toBe('session-xyz');
    });
  });

  describe('addMessage / getHistory', () => {
    it('stores user and assistant messages', () => {
      store = makeStore();
      store.getOrCreateContact(3);
      store.addMessage('contact-3', 'user', 'hello bot');
      store.addMessage('contact-3', 'assistant', 'hello human');

      const history = store.getHistory('contact-3', 10);
      expect(history).toHaveLength(2);
    });

    it('returns messages in descending order (newest first)', () => {
      store = makeStore();
      store.getOrCreateContact(4);
      store.addMessage('contact-4', 'user', 'first');
      store.addMessage('contact-4', 'user', 'second');

      const history = store.getHistory('contact-4', 10);
      expect(history[0].content).toBe('second');
      expect(history[1].content).toBe('first');
    });

    it('respects the limit parameter', () => {
      store = makeStore();
      store.getOrCreateContact(5);
      for (let i = 0; i < 25; i++) {
        store.addMessage('contact-5', 'user', `msg ${i}`);
      }
      expect(store.getHistory('contact-5', 10)).toHaveLength(10);
      expect(store.getHistory('contact-5', 5)).toHaveLength(5);
    });

    it('returns empty array for unknown contact', () => {
      store = makeStore();
      expect(store.getHistory('contact-999', 10)).toHaveLength(0);
    });

    it('isolates messages between contacts', () => {
      store = makeStore();
      store.getOrCreateContact(6);
      store.getOrCreateContact(7);
      store.addMessage('contact-6', 'user', 'from 6');
      store.addMessage('contact-7', 'user', 'from 7');

      expect(store.getHistory('contact-6', 10)[0].content).toBe('from 6');
      expect(store.getHistory('contact-7', 10)[0].content).toBe('from 7');
    });
  });
});
