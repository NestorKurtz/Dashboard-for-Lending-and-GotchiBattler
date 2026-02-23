import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as { key: string; value: string }[]
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const db = getDb()
  const upsert = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
  for (const [key, value] of Object.entries(data)) {
    upsert.run(key, value)
  }
  return NextResponse.json({ ok: true })
}
