// Stale / malformed persisted state must reseed, not blank the page.
// A browser that kept a blob written by an older build (the v2 workspace had no
// `spaces`) used to crash on the first render: `Cannot read properties of
// undefined (reading 'map')`.
//
// Run:  node docs/playwright/stale-storage.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const KEY = 'huddle:v3'
const LEGACY_KEY = 'huddle:v2'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const pageErrors = []
page.on('pageerror', (err) => pageErrors.push(String(err)))

async function loadWith(storage) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate((entries) => {
    window.localStorage.clear()
    for (const [key, value] of Object.entries(entries)) window.localStorage.setItem(key, value)
  }, storage)
  pageErrors.length = 0
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(250)
}

async function sidebarLooksSeeded() {
  const cats = await page.locator('.cat-label').allTextContents()
  const rows = await page.locator('.cat-channels .chan-row').count()
  return { ok: cats.join(',') === 'Product,General' && rows === 4, cats: cats.join(','), rows }
}

// --- 1. a v2 blob left behind by the previous build --------------------------
await loadWith({
  [LEGACY_KEY]: JSON.stringify({
    workspace: { members: [], categories: [], channels: [] },
    activeChannelId: 'decision-app',
    activeThreadId: null,
    threadView: 'split',
  }),
})
const legacy = await sidebarLooksSeeded()
check(
  'a v2 blob under the old key does not blank the page',
  legacy.ok && pageErrors.length === 0,
  `categories=${JSON.stringify(legacy.cats)} rows=${legacy.rows} errors=${pageErrors.length}`,
)

// --- 2. a malformed blob under the CURRENT key -------------------------------
await loadWith({
  [KEY]: JSON.stringify({
    workspace: { members: [], categories: [], channels: [] }, // no `spaces`
    activeChannelId: 'decision-app',
    activeThreadId: null,
    threadView: 'split',
  }),
})
const malformed = await sidebarLooksSeeded()
check(
  'a blob missing `workspace.spaces` reseeds instead of throwing',
  malformed.ok && pageErrors.length === 0,
  `categories=${JSON.stringify(malformed.cats)} rows=${malformed.rows} errors=${pageErrors.length}`,
)

// --- 3. outright garbage under the current key -------------------------------
await loadWith({ [KEY]: '{not json' })
const garbage = await sidebarLooksSeeded()
check(
  'unparseable storage reseeds instead of throwing',
  garbage.ok && pageErrors.length === 0,
  `categories=${JSON.stringify(garbage.cats)} rows=${garbage.rows} errors=${pageErrors.length}`,
)

// --- 4. a well-formed blob is still honoured --------------------------------
await loadWith({})
await page.evaluate((key) => {
  const state = JSON.parse(window.localStorage.getItem(key) ?? '{}')
  state.workspace.channels[0].topic = 'LOADED FROM STORAGE'
  window.localStorage.setItem(key, JSON.stringify(state))
}, KEY)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(250)
const header = await page.locator('.channel .panel-header').innerText()
check(
  'a well-formed blob is still loaded, not discarded',
  header.includes('LOADED FROM STORAGE'),
  `headerHasMarker=${header.includes('LOADED FROM STORAGE')}`,
)

await page.evaluate(() => window.localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
