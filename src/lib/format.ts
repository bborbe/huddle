// Platform-neutral formatting helpers. No DOM, no browser APIs.

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  const diffMin = Math.round((now.getTime() - then.getTime()) / 60_000)

  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`

  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`

  const diffDay = Math.round(diffHr / 24)
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d`

  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function duration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
