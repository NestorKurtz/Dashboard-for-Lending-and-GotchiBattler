import { NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { encodeCall, decodeResult, multicall, EncodedCall } from '@/lib/multicall'
import { getNFTTokenIds, getLentOutTokenIds } from '@/lib/alchemy'
import { enrichGotchi } from '@/lib/lending'

// Exported for testing
export function buildGotchiCalls(tokenIds: number[]): EncodedCall[] {
  return tokenIds.map(id =>
    encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'getAavegotchi', [BigInt(id)])
  )
}

export function parseGotchiResults(tokenIds: number[], rawResults: (string | null)[]) {
  return tokenIds.map((id, i) => {
    if (!rawResults[i]) return { tokenId: id, name: `Gotchi #${id}`, status: 'available', onchainStatus: -1 }
    try {
      const decoded = decodeResult(AAVEGOTCHI_ABI as any, 'getAavegotchi', rawResults[i] as `0x${string}`) as any
      return {
        tokenId: id,
        name: decoded.name || `Gotchi #${id}`,
        status: 'available',
        onchainStatus: Number(decoded.status),
        brs: Number(decoded.baseRarityScore),
        mrs: Number(decoded.modifiedRarityScore),
        traits: Array.from(decoded.modifiedNumericTraits as bigint[]).map(Number),
      }
    } catch (e) {
      console.error(`Failed to decode gotchi #${id}:`, e)
      return { tokenId: id, name: `Gotchi #${id}`, status: 'available', onchainStatus: -1 }
    }
  })
}

export async function GET() {
  const OWNER = process.env.NEXT_PUBLIC_OWNER_ADDRESS
  if (!OWNER || !isAddress(OWNER)) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_OWNER_ADDRESS is not set or is not a valid address' }, { status: 500 })
  }
  try {
    const [walletIds, lentOutIds] = await Promise.all([
      getNFTTokenIds(OWNER, AAVEGOTCHI_DIAMOND),
      getLentOutTokenIds(OWNER!, AAVEGOTCHI_DIAMOND),
    ])
    const tokenIds = [...new Set([...walletIds, ...lentOutIds])]
    if (!tokenIds.length) return NextResponse.json({ error: 'No Gotchis found for owner' }, { status: 404 })

    const detailCalls = buildGotchiCalls(tokenIds)
    const results = await multicall(detailCalls)
    const gotchis = parseGotchiResults(tokenIds, results)

    const lendingCalls = tokenIds.map(id =>
      encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'getGotchiLendingFromToken', [id])
    )
    const lendingResults = await multicall(lendingCalls)

    const now = Math.floor(Date.now() / 1000)
    const lentOutSet = new Set(lentOutIds)
    const walletSet = new Set(walletIds)

    const enriched = gotchis.map((g, i) => {
      const raw = lendingResults[i]
      let lending = null
      if (raw) {
        try {
          const l = decodeResult(AAVEGOTCHI_ABI as any, 'getGotchiLendingFromToken', raw as `0x${string}`) as any
          lending = {
            listingId:   Number(l.listingId),
            canceled:    l.canceled,
            completed:   l.completed,
            timeAgreed:  Number(l.timeAgreed),
            period:      Number(l.period),
            borrower:    l.borrower,
            whitelistId: Number(l.whitelistId),
            initialCost: l.initialCost as bigint,
            revenueSplit: Array.from(l.revenueSplit as number[]).map(Number),
          }
        } catch (e) {
          console.error(`Failed to decode lending for gotchi #${g.tokenId}:`, e)
        }
      }
      return enrichGotchi(g, lending, walletSet.has(g.tokenId), lentOutSet.has(g.tokenId), now)
    }).filter(Boolean)

    const output = enriched.map(g => {
      const { onchainStatus: _, ...rest } = g as any
      // JSON cannot serialize BigInt — convert to decimal string
      if (rest.initialCost != null) rest.initialCost = String(rest.initialCost)
      return rest
    })
    return NextResponse.json({ gotchis: output })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
