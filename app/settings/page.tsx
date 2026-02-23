'use client'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export default function Settings() {
  const { address: connectedAddress } = useAccount()
  const [settings, setSettings] = useState({ ownerAddress: '', alchemyKey: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => setSettings(prev => ({ ...prev, ...s })))
  }, [])

  async function save() {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Settings</h1>
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <label className="block text-sm text-gray-400">
          Trezor (owner) address
          <input value={settings.ownerAddress} onChange={e => setSettings(s => ({ ...s, ownerAddress: e.target.value }))}
            placeholder="0x…" className="mt-1 w-full bg-gray-700 rounded px-3 py-2 text-sm block" />
        </label>
        <div className="text-sm text-gray-400">
          Connected operator (Rabby)
          <div className="mt-1 px-3 py-2 bg-gray-700 rounded text-sm text-purple-300">
            {connectedAddress ?? 'Not connected'}
          </div>
        </div>
        <label className="block text-sm text-gray-400">
          Alchemy API key
          <input type="password" value={settings.alchemyKey} onChange={e => setSettings(s => ({ ...s, alchemyKey: e.target.value }))}
            className="mt-1 w-full bg-gray-700 rounded px-3 py-2 text-sm block" />
        </label>
        <button onClick={save} className="w-full bg-purple-600 rounded py-2 text-sm hover:bg-purple-500">
          {saved ? 'Saved!' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
