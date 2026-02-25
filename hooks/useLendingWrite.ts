'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { Template } from '@/types'
import { buildAddLendingArgs } from '@/lib/lending'

export interface AgreeArgs {
  listingId: number
  tokenId: number
  initialCost: string  // decimal string from API (JSON-safe bigint)
  period: number
  revenueSplit: number[]
}

export function useLendingWrite() {
  const { writeContractAsync, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  async function addLending(tokenId: number, template: Template, ownerAddress: string) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'addGotchiLending',
      args: buildAddLendingArgs(tokenId, template, ownerAddress),
    })
  }

  async function batchAddLending(tokenIds: number[], template: Template, ownerAddress: string) {
    const listings = tokenIds.map(id => buildAddLendingArgs(id, template, ownerAddress))
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'batchAddGotchiListing',
      args: [listings as any],
    })
  }

  async function cancelLending(listingId: number) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'cancelGotchiLending',
      args: [listingId],
    })
  }

  async function batchCancelLending(listingIds: number[]) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'batchCancelGotchiLending',
      args: [listingIds],
    })
  }

  async function batchClaimAndEnd(tokenIds: number[]) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'batchClaimAndEndGotchiLending',
      args: [tokenIds],
    })
  }

  // Agree to a single listing — msg.sender becomes the borrower.
  // No batch version: agreeGotchiLending checks the whitelist against msg.sender,
  // so any intermediary contract (multicall3 etc.) would fail the whitelist check.
  async function agreeLending(a: AgreeArgs) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'agreeGotchiLending',
      args: [a.listingId, a.tokenId, BigInt(a.initialCost), a.period, a.revenueSplit as [number, number, number]],
    })
  }

  return {
    addLending, batchAddLending,
    cancelLending, batchCancelLending, batchClaimAndEnd,
    agreeLending,
    isConfirming,
  }
}
