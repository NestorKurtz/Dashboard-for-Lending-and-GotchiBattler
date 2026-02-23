import { encodeCall } from '@/lib/multicall'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'

describe('multicall helpers', () => {
  it('encodes a call correctly', () => {
    const call = encodeCall(
      AAVEGOTCHI_DIAMOND,
      AAVEGOTCHI_ABI as any,
      'allAavegotchisOfOwner',
      ['0x1234567890123456789012345678901234567890']
    )
    expect(call.target).toBe(AAVEGOTCHI_DIAMOND)
    // Jest-correct: typeof check (not Vitest's toBeTypeOf)
    expect(typeof call.callData).toBe('string')
    expect(call.callData).toMatch(/^0x/)
  })
})
