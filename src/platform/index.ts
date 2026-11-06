// Platform seam.
//
// Shared, platform-neutral code lives in `src/lib/` — types, fixtures, state,
// formatting. It must never import from `src/components/` or touch the DOM.
//
// Web-only code (DOM markup, hover/focus styling, keyboard shortcuts, scrolling)
// lives in `src/components/`. A future native shell would import from here and
// from `src/lib/` only, and supply its own view layer.

export * from '../lib/types'
