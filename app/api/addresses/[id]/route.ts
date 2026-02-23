import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, address, tag, notes } = await req.json()
  const db = getDb()
  db.prepare(`UPDATE addresses SET name=?, address=?, tag=?, notes=? WHERE id=?`)
    .run(name, address, tag, notes ?? null, params.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  db.prepare(`DELETE FROM addresses WHERE id=?`).run(params.id)
  return NextResponse.json({ ok: true })
}
