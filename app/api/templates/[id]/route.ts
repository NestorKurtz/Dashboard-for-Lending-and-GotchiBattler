import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await req.json()
  const db = getDb()
  db.prepare(`
    UPDATE templates SET name=?, period_seconds=?, borrower_split=?,
    third_party_split=?, third_party_address=?, whitelist_id=?, revenue_tokens=?
    WHERE id=?
  `).run(t.name, t.periodSeconds, t.borrowerSplit, t.thirdPartySplit,
    t.thirdPartyAddress ?? '', t.whitelistId ?? 0,
    JSON.stringify(t.revenueTokens ?? []), id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare(`DELETE FROM templates WHERE id=?`).run(id)
  return NextResponse.json({ ok: true })
}
