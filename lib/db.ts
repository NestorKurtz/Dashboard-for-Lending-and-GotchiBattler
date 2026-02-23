import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  const dataDir = path.join(process.cwd(), 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  _db = new Database(path.join(dataDir, 'dashboard.db'))
  _db.pragma('journal_mode = WAL')
  migrate(_db)
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      name    TEXT NOT NULL,
      address TEXT NOT NULL UNIQUE,
      tag     TEXT NOT NULL DEFAULT 'mine',
      notes   TEXT
    );

    CREATE TABLE IF NOT EXISTS templates (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT NOT NULL,
      period_seconds      INTEGER NOT NULL,
      owner_split         INTEGER NOT NULL DEFAULT 0,
      borrower_split      INTEGER NOT NULL,
      third_party_split   INTEGER NOT NULL DEFAULT 0,
      third_party_address TEXT NOT NULL DEFAULT '',
      whitelist_id        INTEGER NOT NULL DEFAULT 0,
      revenue_tokens      TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS lending_cache (
      listing_id  INTEGER PRIMARY KEY,
      token_id    INTEGER NOT NULL,
      borrower    TEXT,
      template_id INTEGER,
      created_at  INTEGER,
      expires_at  INTEGER,
      status      TEXT NOT NULL DEFAULT 'listed'
    );
  `)
}
