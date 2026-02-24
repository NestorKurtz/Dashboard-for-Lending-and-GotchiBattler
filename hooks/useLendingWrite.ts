'use client'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { AAVEGOTCHI_ABI } from '@/lib/aavegotchi-abi'
import { AAVEGOTCHI_DIAMOND } from '@/lib/contracts'
import { Template } from '@/types'

export function useLendingWrite() {
  const { writeContractAsync, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  async function addLending(tokenId: number, template: Template, ownerAddress: string) {
    return writeContractAsync({
      address: AAVEGOTCHI_DIAMOND,
      abi: AAVEGOTCHI_ABI,
      functionName: 'addGotchiLending',
      args: [
        tokenId,
        BigInt(0),
        template.periodSeconds,
        [template.ownerSplit, template.borrowerSplit, template.thirdPartySplit],
        ownerAddress as `0x${string}`,
        (template.thirdPartyAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
        template.whitelistId,
        template.revenueTokens as `0x${string}`[],
      ],
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
