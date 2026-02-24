'use client'
import { useState, useEffect } from 'react'
import { useLendingWrite } from '@/hooks/useLendingWrite'
import { Template } from '@/types'

interface Props {
  tokenIds: number[]
  onClose: () => void
  onSuccess: () => void
}

export function LendingModal({ tokenIds, onClose, onSuccess }: Props) {
  const { addLending, isConfirming } = useLendingWrite()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const OWNER = process.env.NEXT_PUBLIC_OWNER_ADDRESS!

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(setTemplates)
  }, [])

  async function submit() {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return
    setStatus(`Lending ${tokenIds.length} gotchi(s)…`)
    let done = 0
    for (const id of tokenIds) {
      try {
        await addLending(id, template, OWNER)
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

  const template = templates.find(t => t.id === selectedTemplate)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-600">
        <h2 className="text-lg font-bold mb-4">Lend {tokenIds.length} Gotchi{tokenIds.length > 1 ? 's' : ''}</h2>

        <label className="block text-sm text-gray-400 mb-1">Template</label>
        <select value={selectedTemplate ?? ''} onChange={e => setSelectedTemplate(Number(e.target.value))}
          className="w-full bg-gray-700 rounded px-3 py-2 mb-2 text-sm">
          <option value="">Select template…</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.periodSeconds / 86400}d, {t.borrowerSplit}% borrower)</option>
          ))}
        </select>

        {template && (
          <div className="mb-4 px-3 py-2 bg-gray-700/50 rounded text-xs text-gray-400 space-y-0.5">
            <div>{template.whitelistId === 0 ? 'Open listing — anyone can borrow' : `Whitelist #${template.whitelistId}`}</div>
            <div>Splits: {template.ownerSplit}% owner / {template.borrowerSplit}% borrower / {template.thirdPartySplit}% third party</div>
          </div>
        )}

        {status && <p className="text-sm text-yellow-400 mb-3">{status}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600">Cancel</button>
          <button onClick={submit} disabled={!selectedTemplate || isConfirming}
            className="px-4 py-2 text-sm rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
            {isConfirming ? 'Confirming…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
