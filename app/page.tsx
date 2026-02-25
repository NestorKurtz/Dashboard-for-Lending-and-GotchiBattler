'use client'
import { useState, useMemo } from 'react'
import { useGotchis } from '@/hooks/useGotchis'
import { GotchiCard } from '@/components/GotchiCard'
import { LendingModal } from '@/components/LendingModal'
import { CodeExportModal, type ExportData } from '@/components/CodeExportModal'
import { LendingStatus } from '@/types'
import { useLendingWrite } from '@/hooks/useLendingWrite'
import { errMsg } from '@/lib/utils'

const FILTERS: LendingStatus[] = ['available', 'listed', 'borrowed', 'expired']
type SortKey = 'default' | 'brs-desc' | 'brs-asc'

export default function Dashboard() {
  const { data: gotchis, isLoading, error } = useGotchis()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<LendingStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [showModal, setShowModal] = useState(false)
  const [exportData, setExportData] = useState<ExportData | null>(null)
  const [cancelStatus, setCancelStatus] = useState('')
  const [agreeStatus, setAgreeStatus] = useState('')
  const { batchCancelLending, batchClaimAndEnd, agreeLending, isConfirming } = useLendingWrite()

  const visible = useMemo(() => {
    const filtered = (gotchis ?? []).filter(g => filter === 'all' || g.status === filter)
    if (sort === 'brs-desc') return [...filtered].sort((a, b) => (b.brs ?? 0) - (a.brs ?? 0))
    if (sort === 'brs-asc')  return [...filtered].sort((a, b) => (a.brs ?? 0) - (b.brs ?? 0))
    return filtered
  }, [gotchis, filter, sort])

  const toggle = (id: number) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selListed = (gotchis ?? []).filter(g => selected.has(g.tokenId) && g.status === 'listed' && g.listingId != null)

  async function cancelSelected() {
    const sel = (gotchis ?? []).filter(g => selected.has(g.tokenId))
    const listed = sel.filter(g => g.status === 'listed' && g.listingId != null)
    const active = sel.filter(g => g.status === 'borrowed' || g.status === 'expired')
    try {
      if (listed.length > 0) {
        setCancelStatus(`Cancelling ${listed.length} listing(s)…`)
        await batchCancelLending(listed.map(g => g.listingId!))
      }
      if (active.length > 0) {
        setCancelStatus(`Claiming and ending ${active.length} loan(s)…`)
        await batchClaimAndEnd(active.map(g => g.tokenId))
      }
      setCancelStatus('')
      setSelected(new Set())
    } catch (e) {
      setCancelStatus(`Error: ${errMsg(e)}`)
    }
  }

  async function agreeSelected() {
    const agreements = selListed
      .filter(g => g.initialCost != null && g.period != null && g.revenueSplit != null)
      .map(g => ({
        listingId:   g.listingId!,
        tokenId:     g.tokenId,
        initialCost: g.initialCost!,
        period:      g.period!,
        revenueSplit: g.revenueSplit!,
      }))
    if (!agreements.length) return
    try {
      for (let i = 0; i < agreements.length; i++) {
        setAgreeStatus(`Agreeing ${i + 1}/${agreements.length}…`)
        await agreeLending(agreements[i])
      }
      setAgreeStatus('')
      setSelected(new Set())
    } catch (e) {
      setAgreeStatus(`Error: ${errMsg(e)}`)
    }
  }

  function openAgreeExport() {
    setExportData({
      type: 'agree',
      items: selListed.map(g => ({
        listingId:   g.listingId!,
        tokenId:     g.tokenId,
        name:        g.name,
        initialCost: g.initialCost ?? '0',
        period:      g.period ?? 0,
        revenueSplit: g.revenueSplit ?? [0, 100, 0],
      })),
    })
  }

  function openCancelExport() {
    const sel = (gotchis ?? []).filter(g => selected.has(g.tokenId) && g.listingId != null)
    setExportData({
      type: 'cancel',
      items: sel.map(g => ({ listingId: g.listingId!, name: g.name })),
    })
  }

  if (isLoading) return <div className="text-gray-400">Loading gotchis…</div>
  if (error)     return <div className="text-red-400">Error: {(error as Error).message}</div>

  return (
    <div>
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

      {selected.size > 0 && (
        <div className="mb-4 p-3 bg-purple-900/40 border border-purple-700 rounded-lg flex flex-wrap gap-2 items-center">
          <span className="text-sm">{selected.size} selected</span>
          <button onClick={() => setShowModal(true)}
            className="px-3 py-1 text-sm bg-purple-600 rounded hover:bg-purple-500">
            Lend selected
          </button>
          <button onClick={cancelSelected} disabled={isConfirming}
            className="px-3 py-1 text-sm bg-red-700 rounded hover:bg-red-600 disabled:opacity-50">
            {isConfirming ? 'Confirming…' : 'Cancel selected'}
          </button>
          <button onClick={openCancelExport}
            className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded hover:bg-gray-600">
            as Code
          </button>
          {selListed.length > 0 && (<>
            <div className="w-px h-5 bg-purple-700/60" />
            <button onClick={agreeSelected} disabled={isConfirming}
              className="px-3 py-1 text-sm bg-green-700 rounded hover:bg-green-600 disabled:opacity-50">
              {isConfirming ? 'Confirming…' : `Agree selected (${selListed.length})`}
            </button>
            <button onClick={openAgreeExport}
              className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded hover:bg-gray-600">
              as Code
            </button>
          </>)}
          {(cancelStatus || agreeStatus) && (
            <span className="text-xs text-yellow-400">{cancelStatus || agreeStatus}</span>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-400 hover:text-white">
            Clear
          </button>
        </div>
      )}

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

      {exportData && (
        <CodeExportModal data={exportData} onClose={() => setExportData(null)} />
      )}
    </div>
  )
}
