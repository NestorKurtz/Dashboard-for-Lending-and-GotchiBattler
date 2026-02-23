import { getDb } from '@/lib/db'

describe('address book DB', () => {
  let db: ReturnType<typeof getDb>

  beforeEach(() => {
    db = getDb()
    db.exec(`DELETE FROM addresses`)
  })

  it('inserts and retrieves an address', () => {
    db.prepare(`INSERT INTO addresses (name, address, tag) VALUES (?, ?, ?)`).run('Gotchiverse', '0xabc', 'mine')
    const row = db.prepare(`SELECT * FROM addresses WHERE address = ?`).get('0xabc') as any
    expect(row.name).toBe('Gotchiverse')
    expect(row.tag).toBe('mine')
  })
})
