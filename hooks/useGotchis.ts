'use client'
import { useQuery } from '@tanstack/react-query'
import { Gotchi } from '@/types'

export function useGotchis() {
  return useQuery<Gotchi[]>({
    queryKey: ['gotchis'],
    queryFn: async () => {
      const res = await fetch('/api/gotchis')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data.gotchis
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
