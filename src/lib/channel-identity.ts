// Deterministic channel identity: initials + avatar token, derived from the name/id.
// Pure and platform-neutral, so a channel created at runtime gets the same treatment
// as a seeded one without needing fields on the type.

/** `decision-app` → `DA`, `general` → `GE`, `launch plan` → `LP`. */
export function channelInitials(name: string): string {
  const parts = name
    .split(/[-_\s]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  if (parts.length === 0) return '??'
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
}

/** Stable 1..4 token so a channel keeps its colour across reloads and renames. */
export function channelToken(id: string): 1 | 2 | 3 | 4 {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  const slot = (Math.abs(hash) % 4) + 1
  return slot as 1 | 2 | 3 | 4
}
