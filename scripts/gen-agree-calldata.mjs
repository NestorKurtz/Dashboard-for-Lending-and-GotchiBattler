#!/usr/bin/env node
/**
 * Generates agreeGotchiLending calldata for the top-N listed gotchis by BRS.
 * Usage: node scripts/gen-agree-calldata.mjs [count=17]
 * Requires the dev server running at http://localhost:3000
 */
import { encodeFunctionData } from 'viem'

const DIAMOND   = '0xA99c4B08201F2913Db8D28e71d020c4298F29dBF'
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11'
const TOP_N = parseInt(process.argv[2] ?? '17', 10)

const AGREE_ABI = [{
  name: 'agreeGotchiLending', type: 'function', stateMutability: 'nonpayable',
  inputs: [
    { name: '_listingId',     type: 'uint32'   },
    { name: '_erc721TokenId', type: 'uint32'   },
    { name: '_initialCost',   type: 'uint96'   },
    { name: '_period',        type: 'uint32'   },
    { name: '_revenueSplit',  type: 'uint8[3]' },
  ],
  outputs: [],
}]

const MC3_ABI = [{
  name: 'aggregate3', type: 'function', stateMutability: 'payable',
  inputs: [{ name: 'calls', type: 'tuple[]', components: [
    { name: 'target',       type: 'address' },
    { name: 'allowFailure', type: 'bool'    },
    { name: 'callData',     type: 'bytes'   },
  ]}],
  outputs: [{ name: 'returnData', type: 'tuple[]', components: [
    { name: 'success',    type: 'bool'  },
    { name: 'returnData', type: 'bytes' },
  ]}],
}]

// ---- Fetch ----------------------------------------------------------------

const res = await fetch('http://localhost:3000/api/gotchis')
if (!res.ok) {
  const txt = await res.text()
  console.error('API error:', txt)
  process.exit(1)
}
const { gotchis, error } = await res.json()
if (error) { console.error('API error:', error); process.exit(1) }

// ---- Filter & sort --------------------------------------------------------

const listed = gotchis
  .filter(g =>
    g.status === 'listed'   &&
    g.listingId  != null    &&
    g.initialCost != null   &&
    g.period     != null    &&
    g.revenueSplit != null
  )
  .sort((a, b) => (b.brs ?? 0) - (a.brs ?? 0))
  .slice(0, TOP_N)

if (!listed.length) {
  console.log('No listed gotchis with full lending data found.')
  process.exit(0)
}

// ---- Print table ----------------------------------------------------------

console.log(`\nTop ${listed.length} listed gotchis by BRS:\n`)
console.log('  #  Token    Name                         BRS   ListingId   InitialCost  Period      Split')
console.log('  -  -------  ---------------------------  ----  ----------  -----------  ----------  -----')
listed.forEach((g, i) => {
  const days = (g.period / 86400).toFixed(0) + 'd'
  const name = g.name.length > 27 ? g.name.slice(0, 24) + '…' : g.name
  console.log(
    `${String(i+1).padStart(3)}  ` +
    `${String(g.tokenId).padStart(7)}  ` +
    `${name.padEnd(27)}  ` +
    `${String(g.brs).padStart(4)}  ` +
    `${String(g.listingId).padStart(10)}  ` +
    `${String(g.initialCost).padStart(11)}  ` +
    `${days.padStart(10)}  ` +
    `[${g.revenueSplit.join(',')}]`
  )
})

// ---- Build per-call calldata (for reference / single-call fallback) ------

console.log('\n── Individual calls (for reference / Basescan Write Contract UI) ──\n')
listed.forEach((g, i) => {
  const cd = encodeFunctionData({
    abi: AGREE_ABI,
    functionName: 'agreeGotchiLending',
    args: [g.listingId, g.tokenId, BigInt(g.initialCost), g.period, g.revenueSplit],
  })
  console.log(`#${i+1} ${g.name} (token ${g.tokenId})`)
  console.log(`  Contract : ${DIAMOND}`)
  console.log(`  Calldata : ${cd}\n`)
})

// ---- Batch via multicall3 -------------------------------------------------

const calls = listed.map(g => ({
  target: DIAMOND,
  allowFailure: false,
  callData: encodeFunctionData({
    abi: AGREE_ABI,
    functionName: 'agreeGotchiLending',
    args: [g.listingId, g.tokenId, BigInt(g.initialCost), g.period, g.revenueSplit],
  }),
}))

const batchCalldata = encodeFunctionData({
  abi: MC3_ABI,
  functionName: 'aggregate3',
  args: [calls],
})

console.log('═'.repeat(80))
console.log('BATCH — Send Transaction (Basescan → multicall3)')
console.log('═'.repeat(80))
console.log(`Contract : ${MULTICALL3}`)
console.log(`\nCalldata:\n`)
console.log(batchCalldata)
console.log('\n' + '═'.repeat(80))
