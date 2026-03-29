import Database from 'better-sqlite3';
import { SCHEMA_SQL } from './schema.js';

export interface ContactRecord {
  contact_id: string;
  simplex_contact_id: number;
  kilo_session_id: string | null;
  display_name: string | null;
  first_seen: number;
  last_active: number;
}

export interface MessageRecord {
  id: number;
  contact_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(SCHEMA_SQL);
  }

  getOrCreateContact(simplexContactId: number, displayName?: string): ContactRecord {
    const now = Date.now();
    const contactId = `contact-${simplexContactId}`;

    const existing = this.db
      .prepare('SELECT * FROM contacts WHERE simplex_contact_id = ?')
      .get(simplexContactId) as ContactRecord | undefined;

    if (existing) {
      this.db
        .prepare(
          'UPDATE contacts SET last_active = ?, display_name = COALESCE(?, display_name) WHERE contact_id = ?'
        )
        .run(now, displayName ?? null, existing.contact_id);
      return { ...existing, last_active: now, display_name: displayName ?? existing.display_name };
    }

    this.db
      .prepare(
        'INSERT INTO contacts (contact_id, simplex_contact_id, display_name, first_seen, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .run(contactId, simplexContactId, displayName ?? null, now, now);

    return {
      contact_id: contactId,
      simplex_contact_id: simplexContactId,
      kilo_session_id: null,
      display_name: displayName ?? null,
      first_seen: now,
      last_active: now,
    };
  }

  getKiloSession(contactId: string): string | null {
    const row = this.db
      .prepare('SELECT kilo_session_id FROM contacts WHERE contact_id = ?')
      .get(contactId) as { kilo_session_id: string | null } | undefined;
    return row?.kilo_session_id ?? null;
  }

  setKiloSession(contactId: string, sessionId: string): void {
    this.db
      .prepare('UPDATE contacts SET kilo_session_id = ? WHERE contact_id = ?')
      .run(sessionId, contactId);
  }

  addMessage(contactId: string, role: 'user' | 'assistant', content: string): void {
    this.db
      .prepare('INSERT INTO messages (contact_id, role, content, created_at) VALUES (?, ?, ?, ?)')
      .run(contactId, role, content, Date.now());
  }

  getHistory(contactId: string, limit = 20): MessageRecord[] {
    return this.db
      .prepare('SELECT * FROM messages WHERE contact_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(contactId, limit) as MessageRecord[];
  }

  close(): void {
    this.db.close();
  }
}
