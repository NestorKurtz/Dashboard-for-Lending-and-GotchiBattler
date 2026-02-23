'use client'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()}
        className="px-3 py-1 text-sm bg-gray-700 rounded text-white hover:bg-gray-600">
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    )
  }

  return (
    <button onClick={() => connect({ connector: injected() })}
      className="px-3 py-1 text-sm bg-purple-600 rounded text-white hover:bg-purple-500">
      Connect Rabby
    </button>
  )
}
