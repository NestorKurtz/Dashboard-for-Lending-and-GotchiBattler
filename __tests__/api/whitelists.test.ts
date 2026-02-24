import { getDb } from '@/lib/db'

describe('tracked whitelists DB', () => {
  let db: ReturnType<typeof getDb>

  beforeEach(() => {
    db = getDb()
    db.exec('DELETE FROM tracked_whitelists')
  })

  it('tracks a whitelist ID', () => {
    db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(42)
    const row = db.prepare('SELECT id FROM tracked_whitelists WHERE id = ?').get(42) as any
    expect(row.id).toBe(42)
  })

  it('lists all tracked IDs in order', () => {
    db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(20)
    db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(10)
    const rows = db.prepare('SELECT id FROM tracked_whitelists ORDER BY id').all() as any[]
    expect(rows.map(r => r.id)).toEqual([10, 20])
  })

  it('untracks a whitelist ID', () => {
    db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(99)
    db.prepare('DELETE FROM tracked_whitelists WHERE id = ?').run(99)
    expect(db.prepare('SELECT id FROM tracked_whitelists WHERE id = ?').get(99)).toBeUndefined()
  })

  it('silently ignores duplicate inserts (INSERT OR IGNORE)', () => {
    db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(7)
    db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(7)
    const rows = db.prepare('SELECT id FROM tracked_whitelists').all()
    expect(rows).toHaveLength(1)
  })

  it('untracking a non-existent ID is a no-op', () => {
    expect(() => {
      db.prepare('DELETE FROM tracked_whitelists WHERE id = ?').run(9999)
    }).not.toThrow()
    const rows = db.prepare('SELECT id FROM tracked_whitelists').all()
    expect(rows).toHaveLength(0)
  })
})
