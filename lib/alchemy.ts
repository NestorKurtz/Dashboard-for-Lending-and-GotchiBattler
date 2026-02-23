// Thin wrapper around Alchemy JSON-RPC for server-side API routes
export function getAlchemyUrl(): string {
  const key = process.env.ALCHEMY_API_KEY
  if (!key) throw new Error('ALCHEMY_API_KEY not set in .env.local')
  return `https://base-mainnet.g.alchemy.com/v2/${key}`
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
