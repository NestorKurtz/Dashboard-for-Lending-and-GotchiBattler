import { buildAddLendingArgs } from '@/lib/lending'
import type { Template } from '@/types'

const OWNER = '0x1111111111111111111111111111111111111111'
const ZERO  = '0x0000000000000000000000000000000000000000'

const base: Template = {
  id: 1,
  name: 'Test',
  periodSeconds: 604800,
  ownerSplit: 0,
  borrowerSplit: 100,
  thirdPartySplit: 0,
  thirdPartyAddress: '',
  whitelistId: 0,
  revenueTokens: [],
}

describe('buildAddLendingArgs', () => {
  it('produces exactly 8 args', () => {
    expect(buildAddLendingArgs(1, base, OWNER)).toHaveLength(8)
  })

  it('[0] is the tokenId', () => {
    expect(buildAddLendingArgs(99, base, OWNER)[0]).toBe(99)
  })

  it('[1] initialCost is always BigInt(0) — listings are free to enter', () => {
    expect(buildAddLendingArgs(1, base, OWNER)[1]).toBe(BigInt(0))
  })

  it('[2] periodSeconds from template', () => {
    expect(buildAddLendingArgs(1, { ...base, periodSeconds: 86400 }, OWNER)[2]).toBe(86400)
  })

  it('[3] revenueSplit is [ownerSplit, borrowerSplit, thirdPartySplit]', () => {
    const args = buildAddLendingArgs(1, { ...base, ownerSplit: 0, borrowerSplit: 80, thirdPartySplit: 20 }, OWNER)
    expect(args[3]).toEqual([0, 80, 20])
  })

  it('[3] owner split is always 0 per protocol design', () => {
    const args = buildAddLendingArgs(1, { ...base, ownerSplit: 0 }, OWNER)
    expect((args[3] as number[])[0]).toBe(0)
  })

  it('[4] originalOwner is the Trezor owner address', () => {
    expect(buildAddLendingArgs(1, base, OWNER)[4]).toBe(OWNER)
  })

  it('[5] thirdParty falls back to zero address when thirdPartyAddress is empty', () => {
    expect(buildAddLendingArgs(1, { ...base, thirdPartyAddress: '' }, OWNER)[5]).toBe(ZERO)
  })

  it('[5] thirdParty uses template address when set', () => {
    const addr = '0x2222222222222222222222222222222222222222'
    expect(buildAddLendingArgs(1, { ...base, thirdPartyAddress: addr }, OWNER)[5]).toBe(addr)
  })

  it('[6] whitelistId=0 means open listing', () => {
    expect(buildAddLendingArgs(1, { ...base, whitelistId: 0 }, OWNER)[6]).toBe(0)
  })

  it('[6] whitelistId reflects template restriction', () => {
    expect(buildAddLendingArgs(1, { ...base, whitelistId: 60 }, OWNER)[6]).toBe(60)
  })

  it('[7] revenueTokens passes through from template', () => {
    const tokens = ['0xAAA', '0xBBB']
    expect(buildAddLendingArgs(1, { ...base, revenueTokens: tokens }, OWNER)[7]).toEqual(tokens)
  })

  it('[7] empty revenueTokens is valid (open listing with no revenue share)', () => {
    expect(buildAddLendingArgs(1, { ...base, revenueTokens: [] }, OWNER)[7]).toEqual([])
  })
})
