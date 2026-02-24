'use client'
import { useState, useMemo } from 'react'
import { useGotchis } from '@/hooks/useGotchis'
import { GotchiCard } from '@/components/GotchiCard'
import { LendingModal } from '@/components/LendingModal'
import { LendingStatus } from '@/types'

const FILTERS: LendingStatus[] = ['available', 'listed', 'borrowed', 'expired']
type SortKey = 'default' | 'brs-desc' | 'brs-asc'

export default function Dashboard() {
  const { data: gotchis, isLoading, error } = useGotchis()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<LendingStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [showModal, setShowModal] = useState(false)

  const visible = useMemo(() => {
    const filtered = (gotchis ?? []).filter(g => filter === 'all' || g.status === filter)
    if (sort === 'brs-desc') return [...filtered].sort((a, b) => (b.brs ?? 0) - (a.brs ?? 0))
    if (sort === 'brs-asc')  return [...filtered].sort((a, b) => (a.brs ?? 0) - (b.brs ?? 0))
    return filtered
  }, [gotchis, filter, sort])

  const toggle = (id: number) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (isLoading) return <div className="text-gray-400">Loading gotchis…</div>
  if (error)     return <div className="text-red-400">Error: {(error as Error).message}</div>

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {gotchis?.length ?? 0} Gotchis
          {selected.size > 0 && <span className="ml-2 text-purple-400">({selected.size} selected)</span>}
        </h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setSort(s => s === 'brs-desc' ? 'brs-asc' : s === 'brs-asc' ? 'default' : 'brs-desc')}
            className={`px-3 py-1 text-sm rounded ${sort !== 'default' ? 'bg-yellow-700 text-yellow-100' : 'bg-gray-700 hover:bg-gray-600'}`}>
            BRS {sort === 'brs-desc' ? '↓' : sort === 'brs-asc' ? '↑' : '–'}
          </button>
          <div className="w-px h-5 bg-gray-600" />
          {(['all', ...FILTERS] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded ${filter === f ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
              {f} {f !== 'all' && `(${(gotchis ?? []).filter(g => g.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="mb-4 p-3 bg-purple-900/40 border border-purple-700 rounded-lg flex gap-3 items-center">
          <span className="text-sm">{selected.size} selected</span>
          <button onClick={() => setShowModal(true)}
            className="px-3 py-1 text-sm bg-purple-600 rounded hover:bg-purple-500">
            Lend selected
          </button>
          <button className="px-3 py-1 text-sm bg-red-700 rounded hover:bg-red-600">
            Cancel selected
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-400 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visible.map(g => (
          <GotchiCard key={g.tokenId} gotchi={g} selected={selected.has(g.tokenId)} onToggle={() => toggle(g.tokenId)} />
        ))}
      </div>

      {showModal && (
        <LendingModal
          tokenIds={Array.from(selected)}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setSelected(new Set()) }}
        />
      )}
    </div>
  )
}
