'use client'
import { useState, useEffect } from 'react'
import { useLendingWrite } from '@/hooks/useLendingWrite'
import { Address, Template } from '@/types'

interface Props {
  tokenIds: number[]
  onClose: () => void
  onSuccess: () => void
}

export function LendingModal({ tokenIds, onClose, onSuccess }: Props) {
  const { addLending, isConfirming } = useLendingWrite()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedBorrower, setSelectedBorrower] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const OWNER = process.env.NEXT_PUBLIC_OWNER_ADDRESS!

  useEffect(() => {
    fetch('/api/addresses').then(r => r.json()).then(setAddresses)
    fetch('/api/templates').then(r => r.json()).then(setTemplates)
  }, [])

  async function submit() {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template || !selectedBorrower) return
    setStatus(`Lending ${tokenIds.length} gotchi(s)…`)
    let done = 0
    for (const id of tokenIds) {
      try {
        await addLending(id, selectedBorrower, template, OWNER)
        done++
        setStatus(`${done}/${tokenIds.length} submitted…`)
      } catch (e: any) {
        setStatus(`Error on #${id}: ${e.shortMessage ?? e.message}`)
        return
      }
    }
    setStatus('Done!')
    setTimeout(onSuccess, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-600">
        <h2 className="text-lg font-bold mb-4">Lend {tokenIds.length} Gotchi{tokenIds.length > 1 ? 's' : ''}</h2>

        <label className="block text-sm text-gray-400 mb-1">Borrower</label>
        <select value={selectedBorrower} onChange={e => setSelectedBorrower(e.target.value)}
          className="w-full bg-gray-700 rounded px-3 py-2 mb-4 text-sm">
          <option value="">Select address…</option>
          {addresses.map(a => (
            <option key={a.id} value={a.address}>{a.name} ({a.address.slice(0,6)}…)</option>
          ))}
        </select>

        <label className="block text-sm text-gray-400 mb-1">Template</label>
        <select value={selectedTemplate ?? ''} onChange={e => setSelectedTemplate(Number(e.target.value))}
          className="w-full bg-gray-700 rounded px-3 py-2 mb-4 text-sm">
          <option value="">Select template…</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.periodSeconds / 86400}d, {t.borrowerSplit}% borrower)</option>
          ))}
        </select>

        {status && <p className="text-sm text-yellow-400 mb-3">{status}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600">Cancel</button>
          <button onClick={submit} disabled={!selectedBorrower || !selectedTemplate || isConfirming}
            className="px-4 py-2 text-sm rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
            {isConfirming ? 'Confirming…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
