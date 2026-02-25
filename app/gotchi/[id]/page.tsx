'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/StatusBadge'
import { useState } from 'react'
import { LendingModal } from '@/components/LendingModal'
import { useLendingWrite } from '@/hooks/useLendingWrite'
import { getGotchiTypes } from '@/lib/gotchi-types'
import { errMsg } from '@/lib/utils'

// Display order: row 1 = NRG, BRN, EYC  /  row 2 = AGG, SPK, EYS
const TRAIT_LABELS = [
  { label: 'NRG', i: 0 },
  { label: 'BRN', i: 3 },
  { label: 'EYC', i: 5 },
  { label: 'AGG', i: 1 },
  { label: 'SPK', i: 2 },
  { label: 'EYS', i: 4 },
]

function traitColor(v: number) {
  const dev = Math.abs(v - 50)
  if (dev >= 25) return 'text-yellow-300'   // rare: 0–25 or 75–99
  if (dev >= 13) return 'text-gray-200'     // uncommon
  return 'text-gray-500'                    // common (near 50)
}

function TraitsPanel({ traits }: { traits: number[] }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="text-sm text-gray-400 mb-3">Traits</div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-2">
        {TRAIT_LABELS.map(({ label, i }) => {
          const v = traits[i] ?? 0
          const pct = Math.round((v / 99) * 100)
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-7 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs font-mono w-6 text-right shrink-0 ${traitColor(v)}`}>{v}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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

  const types = data.traits ? getGotchiTypes(data.traits) : []

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        {types.map(t => (
          <span
            key={t.abbr}
            style={{ backgroundColor: t.color, color: t.text }}
            className="text-xs font-bold px-2 py-0.5 rounded"
          >
            {t.abbr}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-gray-400">#{data.tokenId}</span>
        <StatusBadge status={data.status} borrower={data.borrower} whitelistId={data.whitelistId} />
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

      {data.traits && <TraitsPanel traits={data.traits} />}

      <div className="flex gap-3">
        {(data.status === 'available' || data.status === 'expired') && (
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 rounded text-sm hover:bg-purple-500">
            Lend
          </button>
        )}
        {(data.status === 'listed' || data.status === 'borrowed') && data.listingId && (
          <button
            onClick={async () => { try { await cancelLending(data.listingId); refetch() } catch (e) { alert(errMsg(e)) } }}
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
