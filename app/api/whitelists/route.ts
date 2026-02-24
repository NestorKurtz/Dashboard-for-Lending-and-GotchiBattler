import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare('SELECT id FROM tracked_whitelists ORDER BY id').all() as { id: number }[]
  return NextResponse.json({ ids: rows.map(r => r.id) })
}

export async function POST(req: Request) {
  const { id } = await req.json()
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO tracked_whitelists (id) VALUES (?)').run(id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  const db = getDb()
  db.prepare('DELETE FROM tracked_whitelists WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
