import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM templates ORDER BY name`).all() as any[]
  return NextResponse.json(rows.map(r => ({
    ...r,
    revenueTokens: JSON.parse(r.revenue_tokens),
  })))
}

export async function POST(req: NextRequest) {
  const t = await req.json()
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO templates
      (name, period_seconds, owner_split, borrower_split, third_party_split,
       third_party_address, whitelist_id, revenue_tokens)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?)
  `).run(
    t.name, t.periodSeconds, t.borrowerSplit, t.thirdPartySplit,
    t.thirdPartyAddress ?? '', t.whitelistId ?? 0,
    JSON.stringify(t.revenueTokens ?? [])
  )
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
