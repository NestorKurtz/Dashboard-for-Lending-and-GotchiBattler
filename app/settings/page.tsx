'use client'
import { useEffect, useState } from 'react'

interface Config {
  ownerAddress: string
  operatorAddress: string
}

export default function Settings() {
  const [config, setConfig] = useState<Config>({ ownerAddress: '', operatorAddress: '' })

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setConfig)
  }, [])

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <div className="text-sm text-gray-400 mb-1">{label}</div>
        <div className="px-3 py-2 bg-gray-700 rounded text-sm font-mono text-purple-300 break-all">
          {value || '—'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Settings</h1>
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <Row label="Owner address (Trezor)" value={config.ownerAddress} />
        <Row label="Operator address (Rabby)" value={config.operatorAddress} />
        <Row label="Alchemy API key" value="Configured via server environment variable" />
        <p className="text-xs text-gray-500">
          To change any of these values, update <code className="text-gray-400">.env.local</code> and restart the server.
        </p>
      </div>
    </div>
  )
}
