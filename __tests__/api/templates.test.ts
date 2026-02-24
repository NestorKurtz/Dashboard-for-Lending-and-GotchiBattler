import { getDb } from '@/lib/db'

describe('templates DB', () => {
  let db: ReturnType<typeof getDb>

  beforeEach(() => {
    db = getDb()
    db.exec('DELETE FROM templates')
  })

  it('inserts and retrieves a template', () => {
    db.prepare(`
      INSERT INTO templates (name, period_seconds, borrower_split, third_party_split, revenue_tokens)
      VALUES (?, ?, ?, ?, ?)
    `).run('7d Open', 604800, 100, 0, '[]')

    const row = db.prepare('SELECT * FROM templates WHERE name = ?').get('7d Open') as any
    expect(row.period_seconds).toBe(604800)
    expect(row.borrower_split).toBe(100)
    expect(row.owner_split).toBe(0)      // DEFAULT 0
    expect(row.whitelist_id).toBe(0)     // DEFAULT 0
    expect(JSON.parse(row.revenue_tokens)).toEqual([])
  })

  it('stores revenue tokens as JSON and round-trips correctly', () => {
    const tokens = ['0xAAA', '0xBBB']
    db.prepare(`
      INSERT INTO templates (name, period_seconds, borrower_split, third_party_split, revenue_tokens)
      VALUES (?, ?, ?, ?, ?)
    `).run('With tokens', 604800, 80, 10, JSON.stringify(tokens))

    const row = db.prepare('SELECT revenue_tokens FROM templates WHERE name = ?').get('With tokens') as any
    expect(JSON.parse(row.revenue_tokens)).toEqual(tokens)
  })

  it('stores whitelist_id and third_party_address', () => {
    db.prepare(`
      INSERT INTO templates
        (name, period_seconds, borrower_split, third_party_split, whitelist_id, third_party_address, revenue_tokens)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('Restricted', 604800, 80, 20, 60, '0xDEAD', '[]')

    const row = db.prepare('SELECT * FROM templates WHERE name = ?').get('Restricted') as any
    expect(row.whitelist_id).toBe(60)
    expect(row.third_party_address).toBe('0xDEAD')
    expect(row.third_party_split).toBe(20)
  })

  it('updates a template', () => {
    const { lastInsertRowid: id } = db.prepare(`
      INSERT INTO templates (name, period_seconds, borrower_split, third_party_split, revenue_tokens)
      VALUES (?, ?, ?, ?, ?)
    `).run('Original', 604800, 80, 0, '[]')

    db.prepare('UPDATE templates SET name=?, borrower_split=? WHERE id=?').run('Updated', 90, id)

    const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as any
    expect(row.name).toBe('Updated')
    expect(row.borrower_split).toBe(90)
  })

  it('deletes a template', () => {
    const { lastInsertRowid: id } = db.prepare(`
      INSERT INTO templates (name, period_seconds, borrower_split, third_party_split, revenue_tokens)
      VALUES (?, ?, ?, ?, ?)
    `).run('To delete', 604800, 100, 0, '[]')

    db.prepare('DELETE FROM templates WHERE id = ?').run(id)

    expect(db.prepare('SELECT * FROM templates WHERE id = ?').get(id)).toBeUndefined()
  })

  it('lists multiple templates ordered by name', () => {
    db.prepare(`INSERT INTO templates (name, period_seconds, borrower_split, third_party_split, revenue_tokens) VALUES (?, ?, ?, ?, ?)`).run('Zebra', 86400, 100, 0, '[]')
    db.prepare(`INSERT INTO templates (name, period_seconds, borrower_split, third_party_split, revenue_tokens) VALUES (?, ?, ?, ?, ?)`).run('Alpha', 86400, 100, 0, '[]')

    const rows = db.prepare('SELECT name FROM templates ORDER BY name').all() as any[]
    expect(rows.map(r => r.name)).toEqual(['Alpha', 'Zebra'])
  })
})
