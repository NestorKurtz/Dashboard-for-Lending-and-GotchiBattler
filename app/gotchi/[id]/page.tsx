'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/StatusBadge'
import { useState } from 'react'
import { LendingModal } from '@/components/LendingModal'
import { useLendingWrite } from '@/hooks/useLendingWrite'

export default function GotchiDetail() {
  const { id } = useParams()
  const [showModal, setShowModal] = useState(false)
  const { cancelLending, isConfirming } = useLendingWrite()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gotchi', id],
    queryFn: async () => {
      const res = await fetch('/api/gotchis')
      const { gotchis } = await res.json()
      return gotchis.find((g: any) => String(g.tokenId) === String(id))
    },
  })

  if (isLoading) return <div className="text-gray-400">Loading…</div>
  if (!data) return <div className="text-red-400">Gotchi not found</div>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-2">{data.name}</h1>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-gray-400">#{data.tokenId}</span>
        <StatusBadge status={data.status} />
      </div>

      {data.borrower && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-400 mb-1">Borrower</div>
          <div className="font-mono text-sm">{data.borrower}</div>
          {data.expiresAt && (
            <div className="text-xs text-gray-500 mt-1">
              Expires {new Date(data.expiresAt * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {(data.status === 'available' || data.status === 'expired') && (
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 rounded text-sm hover:bg-purple-500">
            Lend
          </button>
        )}
        {(data.status === 'listed' || data.status === 'borrowed') && data.listingId && (
          <button
            onClick={async () => { await cancelLending(data.listingId); refetch() }}
            disabled={isConfirming}
            className="px-4 py-2 bg-red-700 rounded text-sm hover:bg-red-600 disabled:opacity-50">
            {isConfirming ? 'Cancelling…' : 'Cancel lending'}
          </button>
        )}
      </div>

      {showModal && (
        <LendingModal
          tokenIds={[data.tokenId]}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refetch() }}
        />
      )}
    </div>
  )
}
