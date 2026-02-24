// ABI sourced from official Aavegotchi Diamond:
// https://github.com/aavegotchi/aavegotchi-contracts/blob/master/diamondABI/diamond.json
export const AAVEGOTCHI_ABI = [
  // --- Read: gotchi info (full struct, correct field order) ---
  {
    name: 'getAavegotchi',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    outputs: [
      {
        name: 'aavegotchiInfo_',
        type: 'tuple',
        components: [
          { name: 'tokenId',              type: 'uint256'    },
          { name: 'name',                 type: 'string'     },
          { name: 'owner',                type: 'address'    },
          { name: 'randomNumber',         type: 'uint256'    },
          { name: 'status',               type: 'uint256'    }, // 0=portal,2=open,3=gotchi
          { name: 'numericTraits',        type: 'int16[6]'   },
          { name: 'modifiedNumericTraits',type: 'int16[6]'   },
          { name: 'equippedWearables',    type: 'uint16[16]' },
          { name: 'collateral',           type: 'address'    },
          { name: 'escrow',               type: 'address'    },
          { name: 'stakedAmount',         type: 'uint256'    },
          { name: 'minimumStake',         type: 'uint256'    },
          { name: 'kinship',              type: 'uint256'    },
          { name: 'lastInteracted',       type: 'uint256'    },
          { name: 'experience',           type: 'uint256'    },
          { name: 'toNextLevel',          type: 'uint256'    },
          { name: 'usedSkillPoints',      type: 'uint256'    },
          { name: 'level',                type: 'uint256'    },
          { name: 'hauntId',              type: 'uint256'    },
          { name: 'baseRarityScore',      type: 'uint256'    },
          { name: 'modifiedRarityScore',  type: 'uint256'    },
          { name: 'locked',               type: 'bool'       },
          {
            name: 'items',
            type: 'tuple[]',
            components: [
              { name: 'balance', type: 'uint256' },
              { name: 'itemId',  type: 'uint256' },
              {
                name: 'itemType',
                type: 'tuple',
                components: [
                  { name: 'name',                type: 'string'     },
                  { name: 'description',         type: 'string'     },
                  { name: 'author',              type: 'string'     },
                  { name: 'traitModifiers',      type: 'int8[6]'    },
                  { name: 'slotPositions',       type: 'bool[16]'   },
                  { name: 'allowedCollaterals',  type: 'uint8[]'    },
                  {
                    name: 'dimensions',
                    type: 'tuple',
                    components: [
                      { name: 'x',      type: 'uint8' },
                      { name: 'y',      type: 'uint8' },
                      { name: 'width',  type: 'uint8' },
                      { name: 'height', type: 'uint8' },
                    ],
                  },
                  { name: 'ghstPrice',             type: 'uint256' },
                  { name: 'maxQuantity',            type: 'uint256' },
                  { name: 'totalQuantity',          type: 'uint256' },
                  { name: 'svgId',                  type: 'uint32'  },
                  { name: 'rarityScoreModifier',    type: 'uint8'   },
                  { name: 'canPurchaseWithGhst',    type: 'bool'    },
                  { name: 'minLevel',               type: 'uint16'  },
                  { name: 'canBeTransferred',       type: 'bool'    },
                  { name: 'category',               type: 'uint8'   },
                  { name: 'kinshipBonus',           type: 'int16'   },
                  { name: 'experienceBonus',        type: 'uint32'  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // --- Read: lending by token (full struct, correct field order) ---
  {
    name: 'getGotchiLendingFromToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_erc721TokenId', type: 'uint32' }],
    outputs: [
      {
        name: 'listing_',
        type: 'tuple',
        components: [
          { name: 'lender',         type: 'address'   },
          { name: 'initialCost',    type: 'uint96'    },
          { name: 'borrower',       type: 'address'   },
          { name: 'listingId',      type: 'uint32'    },
          { name: 'erc721TokenId',  type: 'uint32'    },
          { name: 'whitelistId',    type: 'uint32'    },
          { name: 'originalOwner',  type: 'address'   },
          { name: 'timeCreated',    type: 'uint40'    },
          { name: 'timeAgreed',     type: 'uint40'    },
          { name: 'canceled',       type: 'bool'      }, // NOTE: one 'l'
          { name: 'completed',      type: 'bool'      },
          { name: 'thirdParty',     type: 'address'   },
          { name: 'revenueSplit',   type: 'uint8[3]'  },
          { name: 'lastClaimed',    type: 'uint40'    },
          { name: 'period',         type: 'uint32'    },
          { name: 'revenueTokens',  type: 'address[]' },
          { name: 'permissions',    type: 'uint256'   },
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
      { name: '_tokenId',       type: 'uint32'    },
      { name: '_initialCost',   type: 'uint96'    },
      { name: '_period',        type: 'uint32'    },
      { name: '_revenueSplit',  type: 'uint8[3]'  },
      { name: '_originalOwner', type: 'address'   },
      { name: '_thirdParty',    type: 'address'   },
      { name: '_whitelistId',   type: 'uint32'    },
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
  // --- Read: whitelist by ID ---
  {
    name: 'getWhitelist',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_whitelistId', type: 'uint32' }],
    outputs: [{
      name: 'whitelist_',
      type: 'tuple',
      components: [
        { name: 'name',               type: 'string'    },
        { name: 'owner',              type: 'address'   },
        { name: 'whitelistAddresses', type: 'address[]' },
      ],
    }],
  },
  // --- Write: create new whitelist ---
  {
    name: 'createWhitelist',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_name',                 type: 'string'    },
      { name: '_whitelistAddresses',   type: 'address[]' },
    ],
    outputs: [],
  },
  // --- Write: add addresses to existing whitelist ---
  {
    name: 'updateWhitelist',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_whitelistId',          type: 'uint32'    },
      { name: '_whitelistAddresses',   type: 'address[]' },
    ],
    outputs: [],
  },
  // --- Write: remove addresses from whitelist ---
  {
    name: 'removeAddressesFromWhitelist',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_whitelistId',          type: 'uint32'    },
      { name: '_addressesToRemove',    type: 'address[]' },
    ],
    outputs: [],
  },
] as const
