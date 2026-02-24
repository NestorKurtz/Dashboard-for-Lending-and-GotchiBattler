'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { Template } from '@/types'
import { buildAddLendingArgs } from '@/lib/lending'

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

  async function cancelLending(listingId: number) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'cancelGotchiLending',
      args: [listingId],
    })
  }

  return { addLending, cancelLending, isConfirming }
}
