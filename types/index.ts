export type LendingStatus = 'available' | 'listed' | 'borrowed' | 'expired'

export interface Gotchi {
  tokenId: number
  name: string
  status: LendingStatus
  listingId?: number
  borrower?: string
  expiresAt?: number     // unix seconds
  svgFront?: string      // optional: SVG from on-chain
  brs?: number           // baseRarityScore
  mrs?: number           // modifiedRarityScore (wearables applied)
}

export interface Address {
  id: number
  name: string
  address: string
  tag: 'mine' | 'friend' | 'family'
  notes?: string
}

export interface Template {
  id: number
  name: string
  periodSeconds: number    // e.g. 604800 = 7 days
  ownerSplit: number       // always 0
  borrowerSplit: number
  thirdPartySplit: number
  thirdPartyAddress: string
  whitelistId: number      // 0 = open
  revenueTokens: string[]  // ERC20 addresses
}

export interface GotchiLending {
  listingId: number
  tokenId: number
  borrower: string
  timeCreated: number
  timeAgreed: number
  lastClaimed: number
  completed: boolean
  cancelled: boolean
}
