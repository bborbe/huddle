// SC22 — channels reorder by dragging, and a new channel lands at the bottom.
//
// Four proofs:
//   1. dragging a channel onto another moves it there (specifically: to the bottom)
//   2. the arrangement survives a reload
//   3. a newly created channel lands at the BOTTOM, not in alphabetical position
//   4. dragging inside one category leaves the other categories untouched
//
// Run:  node docs/playwright/sc22-channel-order-drag.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity, freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

async function orderOf(category) {
  return page
    .locator(`[data-category="${category}"] .chan-row`)
    .evaluateAll((els) => els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()))
}

const productBefore = await orderOf('Product')
const generalBefore = await orderOf('General')

check(
  'the seed renders in its stored order',
  JSON.stringify(productBefore) === JSON.stringify(['decision-app', 'agent-platform']),
  JSON.stringify(productBefore),
)

// --- 1. drag the first channel onto the last -------------------------------
const source = page.locator('[data-category="Product"] .chan-wrap').filter({ hasText: 'decision-app' })
const target = page.locator('[data-category="Product"] .chan-wrap').filter({ hasText: 'agent-platform' })

await source.hover()
await page.waitForTimeout(150)
await source.dragTo(target)
await page.waitForTimeout(300)

const productAfterDrag = await orderOf('Product')
check(
  'dragging a channel onto the last row lands it at the bottom',
  JSON.stringify(productAfterDrag) === JSON.stringify(['agent-platform', 'decision-app']),
  JSON.stringify(productAfterDrag),
)

// --- 4. the other category is untouched ------------------------------------
const generalAfterDrag = await orderOf('General')
check(
  'dragging inside one category leaves the others untouched',
  JSON.stringify(generalAfterDrag) === JSON.stringify(generalBefore),
  `${JSON.stringify(generalBefore)} → ${JSON.stringify(generalAfterDrag)}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc22-drag.png' })

// --- 2. the arrangement survives a reload ---------------------------------
await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const productAfterReload = await orderOf('Product')
check(
  'the arrangement survives a reload',
  JSON.stringify(productAfterReload) === JSON.stringify(['agent-platform', 'decision-app']),
  JSON.stringify(productAfterReload),
)

// --- 3. a new channel lands at the bottom ---------------------------------
// `aaa-new` sorts first alphabetically, so landing last proves the order is
// stored rather than sorted.
const productRow = page.locator('section.cat').filter({ has: page.locator('.cat-label:text-is("Product")') })
await productRow.locator('.cat-row').hover()
await page.waitForTimeout(150)
await page.locator('button[aria-label="Create a channel"]').first().click()
await page.waitForTimeout(150)
await page.locator('#new-channel-cat-product').fill('aaa-new')
await page.locator('form.cat-popup input').press('Enter')
await page.waitForTimeout(300)

const productAfterCreate = await orderOf('Product')
check(
  'a newly created channel lands at the bottom, not alphabetically',
  JSON.stringify(productAfterCreate) === JSON.stringify(['agent-platform', 'decision-app', 'aaa-new']),
  JSON.stringify(productAfterCreate),
)

await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
