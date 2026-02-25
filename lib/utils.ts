/** Extracts a human-readable message from any thrown value. */
export function errMsg(e: unknown): string {
  if (e == null) return 'Unknown error'
  const err = e as Record<string, unknown>
  if (typeof err.shortMessage === 'string') return err.shortMessage
  if (typeof err.message === 'string') return err.message
  return String(e)
}
