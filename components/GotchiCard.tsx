'use client'
import { Gotchi } from '@/types'
import { StatusBadge } from './StatusBadge'
import { getGotchiTypes } from '@/lib/gotchi-types'
import Link from 'next/link'

interface Props {
  gotchi: Gotchi
  selected: boolean
  onToggle: () => void
}

export function GotchiCard({ gotchi, selected, onToggle }: Props) {
  const types = gotchi.traits ? getGotchiTypes(gotchi.traits) : []

  return (
    <div
      onClick={onToggle}
      className={`rounded-lg border p-3 cursor-pointer transition-all
        ${selected ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium truncate">{gotchi.name}</span>
        <StatusBadge status={gotchi.status} borrower={gotchi.borrower} whitelistId={gotchi.whitelistId} />
      </div>
      <div className="text-xs text-gray-400 flex gap-2">
        <span>#{gotchi.tokenId}</span>
        {gotchi.brs != null && <span className="text-yellow-500">BRS {gotchi.brs}</span>}
      </div>
      <div className="flex justify-between items-center mt-2">
        <Link
          href={`/gotchi/${gotchi.tokenId}`}
          onClick={e => e.stopPropagation()}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          Details →
        </Link>
        {types.length > 0 && (
          <div className="flex gap-0.5">
            {types.map(t => (
              <span
                key={t.abbr}
                style={{ backgroundColor: t.color, color: t.text }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              >
                {t.abbr}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
