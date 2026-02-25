import { NextResponse } from 'next/server'

// Settings are managed exclusively via environment variables — nothing sensitive
// is stored in the DB or sent to the browser.
export async function GET() {
  return NextResponse.json({
    ownerAddress:    process.env.NEXT_PUBLIC_OWNER_ADDRESS    ?? '',
    operatorAddress: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS ?? '',
  })
}
