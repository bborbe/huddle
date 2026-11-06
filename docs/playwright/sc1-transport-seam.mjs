// SC1 — one model drives the UI, behind exactly one transport seam.
//
// Proves the structural half with greps over the source tree and the behavioural
// half in the browser: the exposed dispatch IS the transport's send, so a call
// through it reaches the reducer. If the transport were not wired, the dispatch
// would be a no-op and the model would not move — that is the negative control.
//
// Run:  node docs/playwright/sc1-transport-seam.mjs

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

/** grep -rn, returning matching lines. A non-zero exit is "no matches", not an error. */
function grep(pattern, target) {
  try {
    const out = execFileSync('grep', ['-rnE', pattern, target], {
      cwd: ROOT,
      encoding: 'utf8',
    })
    return out.split('\n').filter((line) => line.trim().length > 0)
  } catch (error) {
    if (error.status === 1) return []
    throw error
  }
}

// --- structural: one seam, one store, no leaks ------------------------------
check(
  'the transport seam exists',
  existsSync(resolve(ROOT, 'src/platform/transport.ts')),
  'src/platform/transport.ts',
)

const reducers = grep('useReducer\\(', 'src')
check(
  'exactly one useReducer call site, in App.tsx',
  reducers.length === 1 && reducers[0].startsWith('src/App.tsx:'),
  `${reducers.length} hit(s)${reducers.length ? `: ${reducers[0].split(':')[0]}` : ''}`,
)

const componentDispatch = grep('dispatch\\(', 'src/components')
check(
  'no component dispatches — only App.tsx owns the action surface',
  componentDispatch.length === 0,
  `${componentDispatch.length} hit(s)`,
)

const componentTransport = grep('platform/transport', 'src/components')
check(
  'no component imports the transport',
  componentTransport.length === 0,
  `${componentTransport.length} hit(s)`,
)

const appTransport = grep('platform/transport', 'src/App.tsx')
check(
  'App.tsx imports the transport exactly once',
  appTransport.length === 1,
  `${appTransport.length} hit(s)${appTransport.length ? `: ${appTransport[0]}` : ''}`,
)

const componentData = grep("from ['\\\"].*(fixtures|platform/storage)", 'src/components')
check(
  'no component reaches past the model into fixtures or storage',
  componentData.length === 0,
  `${componentData.length} hit(s)`,
)

// --- behavioural: dispatch reaches the reducer through the transport --------
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

const exposed = await page.evaluate(() => ({
  hasState: Boolean(window.__huddle?.state),
  dispatchType: typeof window.__huddle?.dispatch,
}))
check(
  'the model is exposed as window.__huddle { state, dispatch }',
  exposed.hasState && exposed.dispatchType === 'function',
  `state=${exposed.hasState} dispatch=${exposed.dispatchType}`,
)

// React applies the reducer on the next render, so the model is read back in a
// separate evaluation — reading it in the same tick would see the old state and
// make the check pass for the wrong reason.
const before = await page.evaluate(() => window.__huddle.state.activeChannelId)
const other = await page.evaluate(
  (current) =>
    window.__huddle.state.workspace.channels.find((channel) => channel.id !== current)?.id ?? null,
  before,
)
if (other) {
  await page.evaluate(
    (channelId) => window.__huddle.dispatch({ type: 'selectChannel', channelId }),
    other,
  )
  await page.waitForTimeout(200)
}
const after = await page.evaluate(() => window.__huddle.state.activeChannelId)

check(
  'dispatching through the transport moves the model',
  other !== null && after === other && after !== before,
  `${before} → ${after}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc1-transport.png' })
await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
