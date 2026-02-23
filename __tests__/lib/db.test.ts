import { getDb } from '@/lib/db'

describe('database', () => {
  it('initializes all tables', () => {
    const db = getDb()
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table'`
    ).all() as { name: string }[]
    const names = tables.map(t => t.name)
    expect(names).toContain('addresses')
    expect(names).toContain('templates')
    expect(names).toContain('lending_cache')
    expect(names).toContain('settings')
  })
})
