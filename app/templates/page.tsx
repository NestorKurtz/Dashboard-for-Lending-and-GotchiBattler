'use client'
import { useState, useEffect } from 'react'
import { isAddress } from 'viem'
import { Template } from '@/types'
import { REVENUE_TOKENS } from '@/lib/contracts'

const TOKEN_LIST = Object.entries(REVENUE_TOKENS)

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [form, setForm] = useState({
    name: '', periodDays: 7, borrowerSplit: 100, thirdPartySplit: 0,
    thirdPartyAddress: '', whitelistId: 0, revenueTokens: [] as string[],
  })
  const [error, setError] = useState('')

  const load = () => fetch('/api/templates').then(r => r.json()).then(setTemplates)
  useEffect(() => { load() }, [])

  function toggleToken(addr: string) {
    setForm(f => ({
      ...f,
      revenueTokens: f.revenueTokens.includes(addr)
        ? f.revenueTokens.filter(t => t !== addr)
        : [...f.revenueTokens, addr],
    }))
  }

  async function add() {
    setError('')
    if (!form.name.trim()) { setError('Name is required'); return }
    if (form.periodDays <= 0) { setError('Period must be at least 1 day'); return }
    if (form.borrowerSplit + form.thirdPartySplit !== 100) {
      setError('Borrower % + third-party % must equal 100'); return
    }
    if (form.thirdPartySplit > 0 && !isAddress(form.thirdPartyAddress)) {
      setError('Valid third-party address required'); return
    }

    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, periodSeconds: form.periodDays * 86400, ownerSplit: 0 }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
      return
    }
    load()
  }

  async function remove(id: number) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Lending Templates</h1>

      <div className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
        <input placeholder="Template name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="bg-gray-700 rounded px-3 py-2 text-sm col-span-2" />
        <label className="text-sm text-gray-400 flex flex-col gap-1">
          Period (days)
          <input type="number" min={1} value={form.periodDays} onChange={e => setForm(f => ({ ...f, periodDays: Number(e.target.value) }))}
            className="bg-gray-700 rounded px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-gray-400 flex flex-col gap-1">
          Borrower % <span className="text-gray-500">(owner always 0)</span>
          <input type="number" min={0} max={100} value={form.borrowerSplit} onChange={e => setForm(f => ({ ...f, borrowerSplit: Number(e.target.value) }))}
            className="bg-gray-700 rounded px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-gray-400 flex flex-col gap-1">
          Whitelist ID <span className="text-gray-500">(0 = open)</span>
          <input type="number" min={0} value={form.whitelistId} onChange={e => setForm(f => ({ ...f, whitelistId: Number(e.target.value) }))}
            className="bg-gray-700 rounded px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-gray-400 flex flex-col gap-1">
          Third-party %
          <input type="number" min={0} max={100} value={form.thirdPartySplit} onChange={e => setForm(f => ({ ...f, thirdPartySplit: Number(e.target.value) }))}
            className="bg-gray-700 rounded px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-gray-400 flex flex-col gap-1 col-span-2">
          Third-party address <span className="text-gray-500">(required if third-party % &gt; 0)</span>
          <input placeholder="0x…" value={form.thirdPartyAddress} onChange={e => setForm(f => ({ ...f, thirdPartyAddress: e.target.value }))}
            className="bg-gray-700 rounded px-3 py-2 text-sm font-mono" />
        </label>
        <div className="col-span-2">
          <p className="text-sm text-gray-400 mb-2">Revenue tokens</p>
          <div className="flex flex-wrap gap-2">
            {TOKEN_LIST.map(([symbol, addr]) => (
              <button key={symbol} onClick={() => toggleToken(addr)}
                className={`px-3 py-1 text-sm rounded ${form.revenueTokens.includes(addr) ? 'bg-purple-600' : 'bg-gray-700'}`}>
                {symbol}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="col-span-2 text-xs text-red-400">{error}</p>}
        <button onClick={add} className="col-span-2 bg-purple-600 rounded px-3 py-2 text-sm hover:bg-purple-500">
          Save template
        </button>
      </div>

      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="bg-gray-800 rounded-lg px-4 py-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{t.name}</span>
              <div className="text-xs text-gray-400 mt-0.5">
                {t.periodSeconds / 86400}d · borrower {t.borrowerSplit}% · third-party {t.thirdPartySplit}%
                {' · '}{t.whitelistId === 0 ? 'open' : `whitelist #${t.whitelistId}`}
              </div>
            </div>
            <button onClick={() => remove(t.id)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
