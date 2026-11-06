// SC10 — channels render in case-insensitive alphabetical order inside each
// category, not in creation order.
//
// The pair is chosen so a case-sensitive ASCII sort would fail it: `Zzz` (0x5A)
// sorts before `aaa` (0x61), so only a case-insensitive comparison puts `aaa`
// first.
//
// Run:  node docs/playwright/sc10-channel-order.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity, freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const ADD = 'button[aria-label="Create a channel"]'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

function productRow() {
  return page.locator('section.cat').filter({ has: page.locator('.cat-label:text-is("Product")') })
}

async function productOrder() {
  return productRow().locator('.chan-row').evaluateAll((els) =>
    els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()),
  )
}

async function createChannel(name) {
  await productRow().locator('.cat-row').hover()
  await page.waitForTimeout(150)
  await page.locator(ADD).first().click()
  await page.waitForTimeout(150)
  await page.locator('form.cat-popup input').fill(name)
  await page.locator('form.cat-popup input').press('Enter')
  await page.waitForTimeout(250)
}

const seeded = await productOrder()
check(
  'seeded channels are already alphabetical',
  JSON.stringify(seeded) === JSON.stringify(['agent-platform', 'decision-app']),
  JSON.stringify(seeded),
)

// Created in the WRONG order on purpose: `Zzz` first, then `aaa`.
await createChannel('Zzz')
await createChannel('aaa')

const sorted = await productOrder()
check(
  'a later-created channel lands in its alphabetical position',
  JSON.stringify(sorted) === JSON.stringify(['aaa', 'agent-platform', 'decision-app', 'Zzz']),
  JSON.stringify(sorted),
)

await page.screenshot({ path: 'docs/evidence/walk-sc10-channel-order.png' })

await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
await page.waitForTimeout(200)
const afterReload = await productOrder()
check(
  'the order survives a reload',
  JSON.stringify(afterReload) === JSON.stringify(['aaa', 'agent-platform', 'decision-app', 'Zzz']),
  JSON.stringify(afterReload),
)

await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
