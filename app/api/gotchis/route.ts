import { NextResponse } from 'next/server'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { encodeCall, decodeResult, multicall, EncodedCall } from '@/lib/multicall'
import { getNFTTokenIds, getLentOutTokenIds } from '@/lib/alchemy'

const OWNER = process.env.NEXT_PUBLIC_OWNER_ADDRESS!

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
        onchainStatus: Number(decoded.status), // 0=portal, 2=open portal, 3=summoned gotchi
        brs: Number(decoded.baseRarityScore),
        mrs: Number(decoded.modifiedRarityScore),
      }
    } catch {
      return { tokenId: id, name: `Gotchi #${id}`, status: 'available', onchainStatus: -1 }
    }
  })
}

export async function GET() {
  try {
    // 1. Get all token IDs: in-wallet + currently lent out (physically transferred away)
    const [walletIds, lentOutIds] = await Promise.all([
      getNFTTokenIds(OWNER, AAVEGOTCHI_DIAMOND),
      getLentOutTokenIds(OWNER, AAVEGOTCHI_DIAMOND),
    ])
    const tokenIds = [...new Set([...walletIds, ...lentOutIds])]
    if (!tokenIds.length) return NextResponse.json({ error: 'No Gotchis found for owner' }, { status: 404 })

    // 2. Batch-fetch gotchi details
    const detailCalls = buildGotchiCalls(tokenIds)
    const results = await multicall(detailCalls)
    const gotchis = parseGotchiResults(tokenIds, results)

    // 3. Batch-fetch lending state (use raw ERC721 tokenIds for contract lookups)
    const lendingCalls = tokenIds.map(id =>
      encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'getGotchiLendingFromToken', [id])
    )
    const lendingResults = await multicall(lendingCalls)

    // 4. Merge lending status into gotchis
    const now = Math.floor(Date.now() / 1000)
    const lentOutSet = new Set(lentOutIds)

    const walletSet = new Set(walletIds)

    const enriched = gotchis.map((g, i) => {
      const raw = lendingResults[i]

      // For lentOut-only IDs (not in wallet): use on-chain status to distinguish summoned Gotchis from portals
      // status=3 means summoned gotchi (currently borrowed out); anything else is a portal/sold token
      if (lentOutSet.has(g.tokenId) && !walletSet.has(g.tokenId)) {
        if (g.onchainStatus === 3) return { ...g, status: 'borrowed' }
        return null  // portal or sold token — exclude
      }

      // Normal wallet Gotchi — skip portals (status 0 or 2); only keep summoned Gotchis (status=3)
      if (g.onchainStatus !== -1 && g.onchainStatus !== 3) return null

      // Use lending data to determine status
      if (!raw) return g

      try {
        const l = decodeResult(AAVEGOTCHI_ABI as any, 'getGotchiLendingFromToken', raw as `0x${string}`) as any
        const listingId = Number(l.listingId)
        const timeAgreed = Number(l.timeAgreed)

        if (l.canceled || l.completed || listingId === 0) return { ...g, status: 'available' }

        const expiresAt = timeAgreed + Number(l.period)
        if (timeAgreed > 0) {
          return { ...g, status: expiresAt < now ? 'expired' : 'borrowed', listingId, borrower: l.borrower, expiresAt }
        }
        return { ...g, status: 'listed', listingId }
      } catch { return g }
    }).filter(Boolean)

    const output = enriched.map(g => { const { onchainStatus: _, ...rest } = g as any; return rest })
    return NextResponse.json({ gotchis: output })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
