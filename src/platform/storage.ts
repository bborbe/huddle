// Web implementation of the platform seam's persistence + id/timestamp services.
// A native shell would provide its own module with the same signatures.
// Everything here is browser-only; src/lib stays free of it.

const KEY = 'chat-ui-prototype:v1'

export function loadState<T>(fallback: T): T {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveState(state: unknown): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or disabled — the demo keeps working in memory.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
