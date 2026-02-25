import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare(`SELECT id, name, address, tag, notes FROM addresses ORDER BY name`).all()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { name, address, tag, notes } = await req.json()
  if (!name || !address || !tag) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!isAddress(address)) return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 })
  const validTags = ['mine', 'friend', 'family']
  if (!validTags.includes(tag)) return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })

  const db = getDb()
  try {
    const result = db.prepare(
      `INSERT INTO addresses (name, address, tag, notes) VALUES (?, ?, ?, ?)`
    ).run(name, address, tag, notes ?? null)
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('UNIQUE')) return NextResponse.json({ error: 'Address already exists' }, { status: 409 })
    throw e
  }
}
