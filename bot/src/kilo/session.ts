import type { KiloClient } from './client.js';

export class SessionManager {
  private sessions: Map<string, string> = new Map();
  private readonly kilo: KiloClient;

  constructor(kilo: KiloClient) {
    this.kilo = kilo;
  }

  getSession(contactId: string): string | undefined {
    return this.sessions.get(contactId);
  }

  setSession(contactId: string, sessionId: string): void {
    this.sessions.set(contactId, sessionId);
  }

  async getOrCreateSession(contactId: string): Promise<string> {
    const existing = this.sessions.get(contactId);
    if (existing) return existing;

    const sessionId = await this.kilo.createSession('/workspace');
    this.sessions.set(contactId, sessionId);
    return sessionId;
  }
}
