'use client'
import { useState, useEffect } from 'react'
import { Address } from '@/types'

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [form, setForm] = useState({ name: '', address: '', tag: 'mine' as Address['tag'], notes: '' })

  const load = () => fetch('/api/addresses').then(r => r.json()).then(setAddresses)
  useEffect(() => { load() }, [])

  async function add() {
    await fetch('/api/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', address: '', tag: 'mine', notes: '' })
    load()
  }

  async function remove(id: number) {
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Address Book</h1>

      {/* Add form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
        <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="bg-gray-700 rounded px-3 py-2 text-sm col-span-2" />
        <input placeholder="0x…" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          className="bg-gray-700 rounded px-3 py-2 text-sm col-span-2" />
        <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value as Address['tag'] }))}
          className="bg-gray-700 rounded px-3 py-2 text-sm">
          <option value="mine">Mine</option>
          <option value="friend">Friend</option>
          <option value="family">Family</option>
        </select>
        <button onClick={add} className="bg-purple-600 rounded px-3 py-2 text-sm hover:bg-purple-500">Add</button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {addresses.map(a => (
          <div key={a.id} className="bg-gray-800 rounded-lg px-4 py-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{a.name}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full
                ${a.tag === 'mine' ? 'bg-purple-700' : a.tag === 'friend' ? 'bg-blue-700' : 'bg-green-700'}`}>
                {a.tag}
              </span>
              <div className="text-xs text-gray-400 mt-0.5">{a.address}</div>
            </div>
            <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
