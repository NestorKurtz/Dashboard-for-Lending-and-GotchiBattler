import type { Template } from '@/types'

export interface ParsedGotchi {
  tokenId: number
  name: string
  status: string
  onchainStatus: number
  brs?: number
  mrs?: number
  traits?: number[]
}

export interface DecodedLending {
  listingId: number
  canceled: boolean
  completed: boolean
  timeAgreed: number
  period: number
  borrower: string
  whitelistId: number
  initialCost: bigint   // uint96 — must be passed unchanged to agreeGotchiLending
  revenueSplit: number[] // [ownerSplit, borrowerSplit, thirdPartySplit]
}

/**
 * Pure function — determines a gotchi's final status from its on-chain data.
 * Separated from the route handler so it can be unit-tested without Alchemy/multicall.
 */
export function enrichGotchi(
  g: ParsedGotchi,
  lending: DecodedLending | null,
  inWallet: boolean,
  lentOut: boolean,
  now: number,
): (ParsedGotchi & {
  listingId?: number; borrower?: string; expiresAt?: number
  whitelistId?: number; initialCost?: bigint; period?: number; revenueSplit?: number[]
}) | null {
  // Lent-out-only (physically transferred away from owner wallet):
  // status=3 means summoned gotchi (currently borrowed); anything else is a portal/sold token.
  if (lentOut && !inWallet) {
    if (g.onchainStatus === 3) return {
      ...g,
      status: 'borrowed',
      ...(lending ? {
        borrower: lending.borrower,
        listingId: lending.listingId,
        initialCost: lending.initialCost,
        period: lending.period,
        revenueSplit: lending.revenueSplit,
      } : {}),
    }
    return null
  }

  // Wallet gotchi: skip portals (status 0 or 2) — only summoned gotchis (3) or decode-failed (-1)
  if (g.onchainStatus !== -1 && g.onchainStatus !== 3) return null

  // No lending data — treat as available
  if (!lending) return g

  if (lending.canceled || lending.completed || lending.listingId === 0)
    return { ...g, status: 'available' }

  const expiresAt = lending.timeAgreed + lending.period
  if (lending.timeAgreed > 0) {
    return {
      ...g,
      status: expiresAt < now ? 'expired' : 'borrowed',
      listingId: lending.listingId,
      borrower: lending.borrower,
      expiresAt,
      initialCost: lending.initialCost,
      period: lending.period,
      revenueSplit: lending.revenueSplit,
    }
  }
  return {
    ...g,
    status: 'listed',
    listingId: lending.listingId,
    whitelistId: lending.whitelistId || undefined,
    initialCost: lending.initialCost,
    period: lending.period,
    revenueSplit: lending.revenueSplit,
  }
}

/**
 * Builds the args tuple for addGotchiLending.
 * Pure function — exported so it can be tested independently of the wagmi hook.
 */
export function buildAddLendingArgs(tokenId: number, template: Template, ownerAddress: string) {
  return [
    tokenId,
    BigInt(0),
    template.periodSeconds,
    [template.ownerSplit, template.borrowerSplit, template.thirdPartySplit],
    ownerAddress as `0x${string}`,
    (template.thirdPartyAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    template.whitelistId,
    template.revenueTokens as `0x${string}`[],
  ] as const
}
