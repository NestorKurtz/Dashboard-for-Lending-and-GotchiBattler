import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM addresses ORDER BY name`).all()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { name, address, tag, notes } = await req.json()
  if (!name || !address || !tag) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const db = getDb()
  const result = db.prepare(
    `INSERT INTO addresses (name, address, tag, notes) VALUES (?, ?, ?, ?)`
  ).run(name, address, tag, notes ?? null)
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
