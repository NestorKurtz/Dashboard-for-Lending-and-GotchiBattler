'use client'
import { Gotchi } from '@/types'
import { StatusBadge } from './StatusBadge'
import Link from 'next/link'

interface Props {
  gotchi: Gotchi
  selected: boolean
  onToggle: () => void
}

export function GotchiCard({ gotchi, selected, onToggle }: Props) {
  return (
    <div
      onClick={onToggle}
      className={`rounded-lg border p-3 cursor-pointer transition-all
        ${selected ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium truncate">{gotchi.name}</span>
        <StatusBadge status={gotchi.status} />
      </div>
      <div className="text-xs text-gray-400">#{gotchi.tokenId}</div>
      {gotchi.borrower && (
        <div className="text-xs text-gray-500 mt-1 truncate">
          → {gotchi.borrower.slice(0, 6)}…{gotchi.borrower.slice(-4)}
        </div>
      )}
      <Link
        href={`/gotchi/${gotchi.tokenId}`}
        onClick={e => e.stopPropagation()}
        className="text-xs text-purple-400 hover:text-purple-300 mt-2 block"
      >
        Details →
      </Link>
    </div>
  )
}
