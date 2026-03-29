export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS contacts (
  contact_id TEXT PRIMARY KEY,
  simplex_contact_id INTEGER UNIQUE NOT NULL,
  kilo_session_id TEXT,
  display_name TEXT,
  first_seen INTEGER NOT NULL,
  last_active INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id, created_at);
`;
