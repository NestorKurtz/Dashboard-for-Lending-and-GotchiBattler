'use client'
import { useMemo, useState } from 'react'
import { encodeFunctionData } from 'viem'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'

// ---- Types ----------------------------------------------------------------

export interface AgreeExportItem {
  listingId: number
  tokenId: number
  name: string
  initialCost: string  // decimal string
  period: number
  revenueSplit: number[]
}

export interface CancelExportItem {
  listingId: number
  name: string
}

export type ExportData =
  | { type: 'agree';  items: AgreeExportItem[] }
  | { type: 'cancel'; items: CancelExportItem[] }

interface Props {
  data: ExportData
  onClose: () => void
}

// ---- Helpers --------------------------------------------------------------

function agreeCalldata(a: AgreeExportItem): string {
  return encodeFunctionData({
    abi: AAVEGOTCHI_ABI,
    functionName: 'agreeGotchiLending',
    args: [a.listingId, a.tokenId, BigInt(a.initialCost), a.period, a.revenueSplit as [number, number, number]],
  })
}

function cancelCalldata(items: CancelExportItem[]): string {
  return encodeFunctionData({
    abi: AAVEGOTCHI_ABI,
    functionName: 'batchCancelGotchiLending',
    args: [items.map(i => i.listingId)],
  })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy}
      className="text-xs px-2 py-0.5 rounded bg-gray-600 hover:bg-gray-500 shrink-0">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ---- Component ------------------------------------------------------------

export function CodeExportModal({ data, onClose }: Props) {
  const contract = AAVEGOTCHI_DIAMOND

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-base font-bold">
            {data.type === 'agree'  && `Agree — ${data.items.length} gotchi${data.items.length > 1 ? 's' : ''}`}
            {data.type === 'cancel' && `Cancel — ${data.items.length} listing${data.items.length > 1 ? 's' : ''}`}
            <span className="ml-2 text-xs font-normal text-gray-400">as Code (fail-safe)</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-5 text-sm">

          {/* Instructions */}
          <div className="text-xs text-gray-400 bg-gray-700/40 rounded p-3 space-y-1">
            <p>Contract: <code className="text-purple-300">{contract}</code></p>
            <p className="mt-1">
              {data.type === 'agree'
                ? 'Each agree is a separate tx — connect the borrower wallet on Basescan → Write Contract → agreeGotchiLending.'
                : 'One tx — connect operator wallet on Basescan → Write Contract → batchCancelGotchiLending.'}
            </p>
          </div>

          {/* Agree: one block per gotchi */}
          {data.type === 'agree' && data.items.map((a, i) => {
            const cd = agreeCalldata(a)
            return (
              <div key={a.tokenId} className="bg-gray-700/50 rounded p-3 space-y-2">
                <div className="text-xs font-medium text-gray-300">
                  #{i + 1} — {a.name} <span className="text-gray-500">(token {a.tokenId})</span>
                </div>
                <div className="text-xs font-mono space-y-0.5 text-gray-400">
                  <div><span className="text-gray-500">_listingId     </span>{a.listingId}</div>
                  <div><span className="text-gray-500">_erc721TokenId </span>{a.tokenId}</div>
                  <div><span className="text-gray-500">_initialCost   </span>{a.initialCost}</div>
                  <div><span className="text-gray-500">_period        </span>{a.period} ({a.period / 86400}d)</div>
                  <div><span className="text-gray-500">_revenueSplit  </span>[{a.revenueSplit.join(', ')}]</div>
                </div>
                <div className="flex items-start gap-2">
                  <code className="flex-1 bg-gray-900 rounded px-2 py-1.5 text-xs font-mono break-all leading-relaxed text-gray-300">
                    {cd}
                  </code>
                  <CopyButton text={cd} />
                </div>
              </div>
            )
          })}

          {/* Cancel: one block */}
          {data.type === 'cancel' && (() => {
            const cd = cancelCalldata(data.items)
            return (
              <div className="bg-gray-700/50 rounded p-3 space-y-2">
                <div className="text-xs font-mono space-y-0.5 text-gray-400">
                  <div><span className="text-gray-500">_listingIds </span>[{data.items.map(i => i.listingId).join(', ')}]</div>
                  <div className="text-gray-600 text-xs mt-1">{data.items.map(i => `${i.listingId}=${i.name}`).join(', ')}</div>
                </div>
                <div className="flex items-start gap-2">
                  <code className="flex-1 bg-gray-900 rounded px-2 py-1.5 text-xs font-mono break-all leading-relaxed text-gray-300">
                    {cd}
                  </code>
                  <CopyButton text={cd} />
                </div>
              </div>
            )
          })()}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600">Close</button>
        </div>
      </div>
    </div>
  )
}
