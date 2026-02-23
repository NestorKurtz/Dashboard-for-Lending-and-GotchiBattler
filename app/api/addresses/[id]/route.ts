import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, address, tag, notes } = await req.json()
  const db = getDb()
  db.prepare(`UPDATE addresses SET name=?, address=?, tag=?, notes=? WHERE id=?`)
    .run(name, address, tag, notes ?? null, id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare(`DELETE FROM addresses WHERE id=?`).run(id)
  return NextResponse.json({ ok: true })
}
