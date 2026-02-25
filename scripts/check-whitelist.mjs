import { encodeFunctionData, decodeFunctionResult } from 'viem'

const KEY = process.env.ALCHEMY_API_KEY
if (!KEY) throw new Error('ALCHEMY_API_KEY env var is not set')
const DIAMOND = '0xA99c4B08201F2913Db8D28e71d020c4298F29dBF'
const MC3 = '0xcA11bde05977b3631167028862bE2a173976CA11'

const LENDING_ABI = [{
  name: 'getGotchiLendingFromToken', type: 'function', stateMutability: 'view',
  inputs: [{ name: '_erc721TokenId', type: 'uint32' }],
  outputs: [{ name: 'listing_', type: 'tuple', components: [
    { name: 'lender', type: 'address' }, { name: 'initialCost', type: 'uint96' },
    { name: 'borrower', type: 'address' }, { name: 'listingId', type: 'uint32' },
    { name: 'erc721TokenId', type: 'uint32' }, { name: 'whitelistId', type: 'uint32' },
    { name: 'originalOwner', type: 'address' }, { name: 'timeCreated', type: 'uint40' },
    { name: 'timeAgreed', type: 'uint40' }, { name: 'canceled', type: 'bool' },
    { name: 'completed', type: 'bool' }, { name: 'thirdParty', type: 'address' },
    { name: 'revenueSplit', type: 'uint8[3]' }, { name: 'lastClaimed', type: 'uint40' },
    { name: 'period', type: 'uint32' }, { name: 'revenueTokens', type: 'address[]' },
    { name: 'permissions', type: 'uint256' },
  ]}],
}]
const MC3_ABI = [{
  name: 'aggregate3', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'calls', type: 'tuple[]', components: [
    { name: 'target', type: 'address' },
    { name: 'allowFailure', type: 'bool' },
    { name: 'callData', type: 'bytes' },
  ]}],
  outputs: [{ name: 'returnData', type: 'tuple[]', components: [
    { name: 'success', type: 'bool' },
    { name: 'returnData', type: 'bytes' },
  ]}],
}]

const tokens = [22369, 18542, 12628, 2415, 4144]
const calls = tokens.map(id => ({
  target: DIAMOND,
  allowFailure: true,
  callData: encodeFunctionData({ abi: LENDING_ABI, functionName: 'getGotchiLendingFromToken', args: [id] }),
}))
const cd = encodeFunctionData({ abi: MC3_ABI, functionName: 'aggregate3', args: [calls] })
const r = await fetch('https://base-mainnet.g.alchemy.com/v2/' + KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: MC3, data: cd }, 'latest'] }),
}).then(x => x.json())

const results = decodeFunctionResult({ abi: MC3_ABI, functionName: 'aggregate3', data: r.result })
results.forEach((res, i) => {
  if (!res.success) { console.log(tokens[i], 'FAILED'); return }
  const l = decodeFunctionResult({ abi: LENDING_ABI, functionName: 'getGotchiLendingFromToken', data: res.returnData })
  console.log(`token ${tokens[i]} → whitelistId: ${l.whitelistId} | thirdParty: ${l.thirdParty}`)
})
