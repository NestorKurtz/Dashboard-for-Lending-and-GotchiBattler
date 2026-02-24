import { NextResponse } from 'next/server'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { encodeCall, decodeResult, multicall } from '@/lib/multicall'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params
    const whitelistId = parseInt(rawId, 10)
    if (isNaN(whitelistId) || whitelistId <= 0)
      return NextResponse.json({ error: 'Invalid whitelist ID' }, { status: 400 })

    const calls = [
      encodeCall(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_ABI as any, 'getWhitelist', [whitelistId]),
    ]
    const [raw] = await multicall(calls)
    if (!raw) return NextResponse.json({ error: 'Whitelist not found' }, { status: 404 })

    const wl = decodeResult(AAVEGOTCHI_ABI as any, 'getWhitelist', raw as `0x${string}`) as any
    return NextResponse.json({
      id: whitelistId,
      name: wl.name,
      owner: wl.owner,
      addresses: (wl.whitelistAddresses ?? []) as string[],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
