import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getDb } from '@/lib/db'

function validateTemplate(t: Record<string, unknown>): string | null {
  if (!t.name) return 'Name is required'
  const period = Number(t.periodSeconds)
  if (!Number.isInteger(period) || period <= 0) return 'Period must be a positive integer (seconds)'
  const borrower = Number(t.borrowerSplit)
  const third = Number(t.thirdPartySplit)
  if (borrower < 0 || borrower > 100 || third < 0 || third > 100) return 'Splits must be 0–100'
  if (borrower + third !== 100) return 'Borrower % + third-party % must equal 100'
  if (third > 0 && !isAddress(String(t.thirdPartyAddress ?? '')))
    return 'Valid third-party address required when third-party % > 0'
  return null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await req.json()
  const err = validateTemplate(t)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const db = getDb()
  db.prepare(`
    UPDATE templates SET name=?, period_seconds=?, borrower_split=?,
    third_party_split=?, third_party_address=?, whitelist_id=?, revenue_tokens=?
    WHERE id=?
  `).run(
    t.name, t.periodSeconds, t.borrowerSplit, t.thirdPartySplit,
    t.thirdPartyAddress ?? '', t.whitelistId ?? 0,
    JSON.stringify(t.revenueTokens ?? []), id
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare(`DELETE FROM templates WHERE id=?`).run(id)
  return NextResponse.json({ ok: true })
}
