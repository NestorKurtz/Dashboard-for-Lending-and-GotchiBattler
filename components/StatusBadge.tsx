import { LendingStatus } from '@/types'

const colors: Record<LendingStatus, string> = {
  available: 'bg-green-700 text-green-100',
  listed:    'bg-blue-700 text-blue-100',
  borrowed:  'bg-yellow-700 text-yellow-100',
  expired:   'bg-red-700 text-red-100',
}

export function StatusBadge({ status }: { status: LendingStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}
