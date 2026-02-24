'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWriteContract } from 'wagmi'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { Address } from '@/types'

interface WhitelistData {
  id: number
  name: string
  owner: string
  addresses: string[]
}

export default function Whitelists() {
  const [whitelists, setWhitelists] = useState<WhitelistData[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [addressBook, setAddressBook] = useState<Address[]>([])
  const [trackInput, setTrackInput] = useState('')
  const [addInputs, setAddInputs] = useState<Record<number, string>>({})
  const [pending, setPending] = useState<number | null>(null) // whitelistId currently processing
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const { writeContractAsync } = useWriteContract()

  const loadAll = useCallback(async () => {
    setLoadError(null)
    try {
      const listRes = await fetch('/api/whitelists').then(r => r.json())
      if (listRes.error) throw new Error(listRes.error)
      const ids: number[] = listRes.ids ?? []
      const results = await Promise.all(
        ids.map(id => fetch(`/api/whitelists/${id}`).then(r => r.json()))
      )
      const good = results.filter((r: any) => !r.error)
      const bad = results.filter((r: any) => r.error)
      if (bad.length) setLoadError(`Failed to load ${bad.length} whitelist(s): ${bad[0].error}`)
      setWhitelists(good)
    } catch (e: any) {
      setLoadError(e.message)
    }
  }, [])

  useEffect(() => {
    loadAll()
    fetch('/api/addresses').then(r => r.json()).then(setAddressBook)
  }, [loadAll])

  function showFeedback(id: number, msg: string) {
    setFeedback(f => ({ ...f, [id]: msg }))
    setTimeout(() => setFeedback(f => { const n = { ...f }; delete n[id]; return n }), 4000)
  }

  async function trackWhitelist() {
    const id = parseInt(trackInput, 10)
    if (isNaN(id) || id <= 0) return
    await fetch('/api/whitelists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setTrackInput('')
    loadAll()
  }

  async function untrack(id: number) {
    await fetch('/api/whitelists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadAll()
  }

  async function addAddresses(whitelistId: number, addresses: string[]) {
    setPending(whitelistId)
    try {
      await writeContractAsync({
        address: AAVEGOTCHI_DIAMOND,
        abi: AAVEGOTCHI_ABI,
        functionName: 'updateWhitelist',
        args: [whitelistId, addresses as `0x${string}`[]],
      })
      setAddInputs(prev => ({ ...prev, [whitelistId]: '' }))
      showFeedback(whitelistId, 'Tx submitted — reload in a moment to confirm')
      setTimeout(loadAll, 5000)
    } catch (e: any) {
      showFeedback(whitelistId, `Error: ${e.shortMessage ?? e.message}`)
    } finally {
      setPending(null)
    }
  }

  async function removeAddress(whitelistId: number, address: string) {
    setPending(whitelistId)
    try {
      await writeContractAsync({
        address: AAVEGOTCHI_DIAMOND,
        abi: AAVEGOTCHI_ABI,
        functionName: 'removeAddressesFromWhitelist',
        args: [whitelistId, [address as `0x${string}`]],
      })
      showFeedback(whitelistId, 'Tx submitted — reload in a moment to confirm')
      setTimeout(loadAll, 5000)
    } catch (e: any) {
      showFeedback(whitelistId, `Error: ${e.shortMessage ?? e.message}`)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Whitelists</h1>

      {loadError && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-sm text-red-300">
          {loadError}
        </div>
      )}

      {whitelists.map(wl => {
        const onWhitelist = new Set(wl.addresses.map(a => a.toLowerCase()))
        const notYetAdded = addressBook.filter(a => !onWhitelist.has(a.address.toLowerCase()))
        const isPending = pending === wl.id

        return (
          <div key={wl.id} className="bg-gray-800 rounded-lg p-4 mb-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-medium">{wl.name}</span>
                <span className="ml-2 text-xs text-gray-500">#{wl.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{wl.addresses.length} addresses</span>
                <button onClick={() => untrack(wl.id)}
                  className="text-xs text-gray-500 hover:text-red-400">untrack</button>
              </div>
            </div>

            {/* Current addresses */}
            <div className="space-y-1 mb-3">
              {wl.addresses.map(addr => {
                const entry = addressBook.find(a => a.address.toLowerCase() === addr.toLowerCase())
                return (
                  <div key={addr} className="flex justify-between items-center py-1 px-2 bg-gray-700 rounded text-xs">
                    <div>
                      {entry && <span className="text-purple-300 mr-2">{entry.name}</span>}
                      <span className="text-gray-400 font-mono">{addr.slice(0, 10)}…{addr.slice(-6)}</span>
                    </div>
                    <button onClick={() => removeAddress(wl.id, addr)} disabled={isPending}
                      className="ml-2 text-red-400 hover:text-red-300 disabled:opacity-40 shrink-0">
                      Remove
                    </button>
                  </div>
                )
              })}
              {wl.addresses.length === 0 && <div className="text-xs text-gray-500 px-2">No addresses yet</div>}
            </div>

            {/* Add from address book */}
            {notYetAdded.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Add from address book</div>
                <div className="flex flex-wrap gap-1">
                  {notYetAdded.map(a => (
                    <button key={a.id} disabled={isPending}
                      onClick={() => addAddresses(wl.id, [a.address])}
                      className="text-xs px-2 py-0.5 bg-gray-700 rounded hover:bg-purple-700 disabled:opacity-40">
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual address input */}
            <div className="flex gap-2">
              <input
                value={addInputs[wl.id] ?? ''}
                onChange={e => setAddInputs(prev => ({ ...prev, [wl.id]: e.target.value }))}
                placeholder="0x… address"
                className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-xs font-mono"
              />
              <button
                disabled={isPending || !addInputs[wl.id]}
                onClick={() => addAddresses(wl.id, [addInputs[wl.id]])}
                className="px-3 py-1.5 text-xs bg-purple-600 rounded hover:bg-purple-500 disabled:opacity-40">
                {isPending ? 'Submitting…' : 'Add'}
              </button>
            </div>

            {feedback[wl.id] && (
              <div className="mt-2 text-xs text-yellow-400">{feedback[wl.id]}</div>
            )}
          </div>
        )
      })}

      {/* Track existing whitelist by on-chain ID */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm font-medium mb-2 text-gray-300">Track another whitelist</div>
        <div className="flex gap-2">
          <input
            value={trackInput}
            onChange={e => setTrackInput(e.target.value)}
            placeholder="On-chain whitelist ID (e.g. 61)"
            className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm"
          />
          <button onClick={trackWhitelist}
            className="px-3 py-2 text-sm bg-purple-600 rounded hover:bg-purple-500">
            Track
          </button>
        </div>
      </div>
    </div>
  )
}
