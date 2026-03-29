import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KiloClient } from './client.js';
import { SessionManager } from './session.js';

function makeKiloClient(sessionId = 'session-abc'): KiloClient {
  return {
    createSession: vi.fn().mockResolvedValue(sessionId),
  } as unknown as KiloClient;
}

describe('SessionManager', () => {
  let kilo: KiloClient;
  let manager: SessionManager;

  beforeEach(() => {
    kilo = makeKiloClient();
    manager = new SessionManager(kilo);
  });

  it('returns undefined for an unknown contact', () => {
    expect(manager.getSession('contact-1')).toBeUndefined();
  });

  it('creates a new session for a contact', async () => {
    const id = await manager.getOrCreateSession('contact-1');
    expect(id).toBe('session-abc');
    expect(kilo.createSession).toHaveBeenCalledOnce();
  });

  it('reuses an existing session on second call', async () => {
    await manager.getOrCreateSession('contact-1');
    await manager.getOrCreateSession('contact-1');
    expect(kilo.createSession).toHaveBeenCalledOnce();
  });

  it('creates independent sessions for different contacts', async () => {
    const kiloMulti = {
      createSession: vi.fn().mockResolvedValueOnce('s1').mockResolvedValueOnce('s2'),
    } as unknown as KiloClient;
    const mgr = new SessionManager(kiloMulti);

    const s1 = await mgr.getOrCreateSession('contact-1');
    const s2 = await mgr.getOrCreateSession('contact-2');
    expect(s1).toBe('s1');
    expect(s2).toBe('s2');
    expect(kiloMulti.createSession).toHaveBeenCalledTimes(2);
  });

  it('setSession stores a session retrievable by getSession', () => {
    manager.setSession('contact-x', 'manual-session');
    expect(manager.getSession('contact-x')).toBe('manual-session');
  });
});
