// Thin wrapper around Alchemy JSON-RPC for server-side API routes
export function getAlchemyUrl(): string {
  const key = process.env.ALCHEMY_API_KEY
  if (!key) throw new Error('ALCHEMY_API_KEY not set in .env.local')
  return `https://base-mainnet.g.alchemy.com/v2/${key}`
}

export function getAlchemyNftUrl(): string {
  const key = process.env.ALCHEMY_API_KEY
  if (!key) throw new Error('ALCHEMY_API_KEY not set in .env.local')
  return `https://base-mainnet.g.alchemy.com/nft/v3/${key}`
}

// Returns all ERC721 tokenIds currently in owner's wallet
export async function getNFTTokenIds(owner: string, contract: string): Promise<number[]> {
  const ids: number[] = []
  let pageKey: string | undefined

  do {
    const params = new URLSearchParams({
      owner,
      'contractAddresses[]': contract,
      withMetadata: 'false',
      pageSize: '100',
    })
    if (pageKey) params.set('pageKey', pageKey)

    const res = await fetch(`${getAlchemyNftUrl()}/getNFTsForOwner?${params}`)
    const json = await res.json()
    if (json.error) throw new Error(json.error.message)

    for (const nft of json.ownedNfts ?? []) {
      ids.push(parseInt(nft.tokenId, 10))
    }
    pageKey = json.pageKey
  } while (pageKey)

  return ids
}

// Returns tokenIds that left owner's wallet and haven't returned — i.e. currently lent out
export async function getLentOutTokenIds(owner: string, contract: string): Promise<number[]> {
  const [fromRes, toRes] = await Promise.all([
    rpcCall<any>('alchemy_getAssetTransfers', [{
      fromAddress: owner, contractAddresses: [contract],
      category: ['erc721'], withMetadata: false, maxCount: '0x3e8',
    }]),
    rpcCall<any>('alchemy_getAssetTransfers', [{
      toAddress: owner, contractAddresses: [contract],
      category: ['erc721'], withMetadata: false, maxCount: '0x3e8',
    }]),
  ])

  // Track the block number of the last transfer direction per tokenId
  const lastSeen: Record<string, { block: number; direction: 'in' | 'out' }> = {}

  for (const t of fromRes.transfers ?? []) {
    const id = String(parseInt(t.tokenId, 16))
    const block = parseInt(t.blockNum, 16)
    if (!lastSeen[id] || block > lastSeen[id].block)
      lastSeen[id] = { block, direction: 'out' }
  }

  for (const t of toRes.transfers ?? []) {
    const id = String(parseInt(t.tokenId, 16))
    const block = parseInt(t.blockNum, 16)
    if (!lastSeen[id] || block > lastSeen[id].block)
      lastSeen[id] = { block, direction: 'in' }
  }

  return Object.entries(lastSeen)
    .filter(([, v]) => v.direction === 'out')
    .map(([id]) => parseInt(id))
}

export async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(getAlchemyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.result as T
}
