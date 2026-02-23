import { buildGotchiCalls, parseGotchiResults } from '@/app/api/gotchis/route'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'

describe('gotchis API helpers', () => {
  it('builds one call per token ID', () => {
    const calls = buildGotchiCalls([1, 2, 3])
    expect(calls).toHaveLength(3)
    expect(calls[0].target).toBe(AAVEGOTCHI_DIAMOND)
  })
})
