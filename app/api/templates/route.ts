import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getDb } from '@/lib/db'

interface TemplateRow {
  id: number
  name: string
  period_seconds: number
  owner_split: number
  borrower_split: number
  third_party_split: number
  third_party_address: string
  whitelist_id: number
  revenue_tokens: string
}

function toTemplate(r: TemplateRow) {
  return {
    id:                r.id,
    name:              r.name,
    periodSeconds:     r.period_seconds,
    ownerSplit:        r.owner_split,
    borrowerSplit:     r.borrower_split,
    thirdPartySplit:   r.third_party_split,
    thirdPartyAddress: r.third_party_address,
    whitelistId:       r.whitelist_id,
    revenueTokens:     JSON.parse(r.revenue_tokens) as string[],
  }
}

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

export async function GET() {
  const db = getDb()
  const rows = db.prepare(
    `SELECT id, name, period_seconds, owner_split, borrower_split,
            third_party_split, third_party_address, whitelist_id, revenue_tokens
     FROM templates ORDER BY name`
  ).all() as TemplateRow[]
  return NextResponse.json(rows.map(toTemplate))
}

export async function POST(req: NextRequest) {
  const t = await req.json()
  const err = validateTemplate(t)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

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
