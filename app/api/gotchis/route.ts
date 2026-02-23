import { NextResponse } from 'next/server'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { encodeCall, decodeResult, multicall, EncodedCall } from '@/lib/multicall'

const OWNER = process.env.NEXT_PUBLIC_OWNER_ADDRESS!

// Exported for testing
export function buildGotchiCalls(tokenIds: number[]): EncodedCall[] {
  return tokenIds.map(id =>
    encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'getAavegotchi', [BigInt(id)])
  )
}

export function parseGotchiResults(tokenIds: number[], rawResults: (string | null)[]) {
  return tokenIds.map((id, i) => {
    if (!rawResults[i]) return { tokenId: id, name: `Gotchi #${id}`, status: 'available' }
    try {
      const decoded = decodeResult(AAVEGOTCHI_ABI as any, 'getAavegotchi', rawResults[i] as `0x${string}`)
      return { tokenId: id, name: (decoded as any).name || `Gotchi #${id}`, status: 'available' }
    } catch {
      return { tokenId: id, name: `Gotchi #${id}`, status: 'available' }
    }
  })
}

export async function GET() {
  try {
    // 1. Get all token IDs owned by Trezor
    const ownerCall = encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'allAavegotchisOfOwner', [OWNER])
    const [ownerResult] = await multicall([ownerCall])
    if (!ownerResult) return NextResponse.json({ error: 'Failed to fetch token IDs' }, { status: 500 })

    const tokenIds = (decodeResult(AAVEGOTCHI_ABI as any, 'allAavegotchisOfOwner', ownerResult as `0x${string}`) as bigint[])
      .map(n => Number(n))

    // 2. Batch-fetch gotchi details
    const detailCalls = buildGotchiCalls(tokenIds)
    const results = await multicall(detailCalls)
    const gotchis = parseGotchiResults(tokenIds, results)

    // 3. Batch-fetch lending state
    const lendingCalls = tokenIds.map(id =>
      encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'getGotchiLendingFromToken', [id])
    )
    const lendingResults = await multicall(lendingCalls)

    // 4. Merge lending status into gotchis
    const now = Math.floor(Date.now() / 1000)
    const enriched = gotchis.map((g, i) => {
      if (!lendingResults[i]) return g
      try {
        const l = decodeResult(AAVEGOTCHI_ABI as any, 'getGotchiLendingFromToken', lendingResults[i] as `0x${string}`) as any
        if (l.cancelled || l.completed || l.listingId === 0) return { ...g, status: 'available' }
        const expiresAt = Number(l.timeAgreed) + Number(l.period)
        if (l.timeAgreed > 0) {
          return { ...g, status: expiresAt < now ? 'expired' : 'borrowed', listingId: Number(l.listingId), borrower: l.borrower, expiresAt }
        }
        return { ...g, status: 'listed', listingId: Number(l.listingId) }
      } catch { return g }
    })

    return NextResponse.json({ gotchis: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
