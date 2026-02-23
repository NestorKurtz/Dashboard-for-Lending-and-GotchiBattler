// Minimal ABI — only functions we call. Extend as needed.
export const AAVEGOTCHI_ABI = [
  // --- Read: ownership ---
  {
    name: 'allAavegotchisOfOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  // --- Read: gotchi info ---
  {
    name: 'getAavegotchi',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'hauntId', type: 'uint256' },
          { name: 'level', type: 'uint256' },
          // add more fields as needed
        ],
      },
    ],
  },
  // --- Read: lending by token ---
  {
    name: 'getGotchiLendingFromToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [
      {
        name: 'listing_',
        type: 'tuple',
        components: [
          { name: 'listingId', type: 'uint32' },
          { name: 'lender', type: 'address' },
          { name: 'borrower', type: 'address' },
          { name: 'tokenId', type: 'uint32' },
          { name: 'initialCost', type: 'uint96' },
          { name: 'period', type: 'uint32' },
          { name: 'revenueSplit', type: 'uint8[3]' },
          { name: 'originalOwner', type: 'address' },
          { name: 'thirdParty', type: 'address' },
          { name: 'whitelistId', type: 'uint32' },
          { name: 'revenueTokens', type: 'address[]' },
          { name: 'timeCreated', type: 'uint40' },
          { name: 'timeAgreed', type: 'uint40' },
          { name: 'lastClaimed', type: 'uint40' },
          { name: 'completed', type: 'bool' },
          { name: 'cancelled', type: 'bool' },
        ],
      },
    ],
  },
  // --- Write: add lending ---
  {
    name: 'addGotchiLending',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_tokenId', type: 'uint32' },
      { name: '_initialCost', type: 'uint96' },
      { name: '_period', type: 'uint32' },
      { name: '_revenueSplit', type: 'uint8[3]' },
      { name: '_originalOwner', type: 'address' },
      { name: '_thirdParty', type: 'address' },
      { name: '_whitelistId', type: 'uint32' },
      { name: '_revenueTokens', type: 'address[]' },
    ],
    outputs: [],
  },
  // --- Write: cancel lending ---
  {
    name: 'cancelGotchiLending',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint32' }],
    outputs: [],
  },
  // --- Write: claim and end ---
  {
    name: 'claimAndEndGotchiLending',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint32' }],
    outputs: [],
  },
] as const
