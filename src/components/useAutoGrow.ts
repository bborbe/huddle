import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * Grow a textarea to fit its content, up to a share of the viewport, then scroll
 * it internally.
 *
 * Height is re-measured from `auto` on every value change, so it shrinks when text
 * is deleted as well as growing when it is typed. The cap is a fraction of the
 * viewport rather than a fixed pixel value, so the composer keeps its proportion on
 * a short window.
 */
export function useAutoGrow(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxViewportShare = 1 / 3,
): void {
  useEffect(() => {
    const field = ref.current
    if (!field) return

    field.style.height = 'auto'
    const contentHeight = field.scrollHeight
    const cap = Math.round(window.innerHeight * maxViewportShare)

    field.style.height = `${Math.min(contentHeight, cap)}px`
    field.style.overflowY = contentHeight > cap ? 'auto' : 'hidden'
  }, [ref, value, maxViewportShare])
}
