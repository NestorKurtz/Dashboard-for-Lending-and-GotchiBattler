import { enrichGotchi, ParsedGotchi, DecodedLending } from '@/lib/lending'

const NOW = 1_000_000

function g(overrides: Partial<ParsedGotchi> = {}): ParsedGotchi {
  return { tokenId: 1, name: 'Test', status: 'available', onchainStatus: 3, ...overrides }
}

function l(overrides: Partial<DecodedLending> = {}): DecodedLending {
  return { listingId: 0, canceled: false, completed: false, timeAgreed: 0, period: 0, borrower: '0x0', ...overrides }
}

describe('enrichGotchi — lent-out-only (not in wallet)', () => {
  it('marks summoned gotchi (status=3) as borrowed', () => {
    expect(enrichGotchi(g({ onchainStatus: 3 }), null, false, true, NOW))
      .toMatchObject({ status: 'borrowed' })
  })

  it('excludes portals (status=0)', () => {
    expect(enrichGotchi(g({ onchainStatus: 0 }), null, false, true, NOW)).toBeNull()
  })

  it('excludes open portals (status=2)', () => {
    expect(enrichGotchi(g({ onchainStatus: 2 }), null, false, true, NOW)).toBeNull()
  })

  it('ignores lending data — status comes from onchainStatus alone', () => {
    // Even with a lending struct, lent-out-only path uses onchainStatus
    expect(enrichGotchi(g({ onchainStatus: 3 }), l({ listingId: 5 }), false, true, NOW))
      .toMatchObject({ status: 'borrowed' })
  })
})

describe('enrichGotchi — wallet gotchis', () => {
  it('excludes portals (status=0)', () => {
    expect(enrichGotchi(g({ onchainStatus: 0 }), null, true, false, NOW)).toBeNull()
  })

  it('excludes open portals (status=2)', () => {
    expect(enrichGotchi(g({ onchainStatus: 2 }), null, true, false, NOW)).toBeNull()
  })

  it('passes through gotchi with no lending data', () => {
    const gotchi = g({ onchainStatus: 3 })
    expect(enrichGotchi(gotchi, null, true, false, NOW)).toEqual(gotchi)
  })

  it('passes through decode-failure fallback (onchainStatus=-1)', () => {
    // -1 is set when getAavegotchi decode throws — we still include the gotchi
    const gotchi = g({ onchainStatus: -1 })
    expect(enrichGotchi(gotchi, null, true, false, NOW)).toEqual(gotchi)
  })

  it('returns available when listing is canceled', () => {
    const result = enrichGotchi(g(), l({ listingId: 5, canceled: true }), true, false, NOW)
    expect(result?.status).toBe('available')
  })

  it('returns available when listing is completed', () => {
    const result = enrichGotchi(g(), l({ listingId: 5, completed: true }), true, false, NOW)
    expect(result?.status).toBe('available')
  })

  it('returns available when listingId is 0 (no active listing)', () => {
    const result = enrichGotchi(g(), l({ listingId: 0 }), true, false, NOW)
    expect(result?.status).toBe('available')
  })

  it('returns listed when listing not yet accepted (timeAgreed=0)', () => {
    const result = enrichGotchi(g(), l({ listingId: 42, timeAgreed: 0 }), true, false, NOW) as any
    expect(result?.status).toBe('listed')
    expect(result?.listingId).toBe(42)
  })

  it('returns borrowed when active and within period', () => {
    const timeAgreed = NOW - 100
    const period = 1000  // expires at NOW + 900 — not expired
    const result = enrichGotchi(g(), l({ listingId: 42, timeAgreed, period, borrower: '0xabc' }), true, false, NOW) as any
    expect(result?.status).toBe('borrowed')
    expect(result?.borrower).toBe('0xabc')
    expect(result?.expiresAt).toBe(timeAgreed + period)
    expect(result?.listingId).toBe(42)
  })

  it('returns expired when past expiry', () => {
    const timeAgreed = NOW - 2000
    const period = 1000  // expired 1000s ago
    const result = enrichGotchi(g(), l({ listingId: 42, timeAgreed, period }), true, false, NOW)
    expect(result?.status).toBe('expired')
  })

  it('expiry boundary: exactly at expiry is still borrowed (strict less-than)', () => {
    const timeAgreed = NOW - 500
    const period = 500  // expiresAt === NOW → condition is expiresAt < now → false → borrowed
    const result = enrichGotchi(g(), l({ listingId: 1, timeAgreed, period }), true, false, NOW)
    expect(result?.status).toBe('borrowed')
  })
})

describe('enrichGotchi — in both wallet and lentOut sets', () => {
  // Shouldn't normally happen but the wallet path takes precedence
  it('follows wallet logic when inWallet=true even if lentOut=true', () => {
    const result = enrichGotchi(g({ onchainStatus: 3 }), null, true, true, NOW)
    // wallet path: no lending → pass through
    expect(result).toMatchObject({ onchainStatus: 3 })
  })
})
