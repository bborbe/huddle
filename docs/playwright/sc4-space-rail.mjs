// SC4 (space-rail entry point) — the rail is a real control, not decoration.
// Proves: rail renders buttons, a switch swaps the sidebar to the other space's
// categories and lands on its first channel, and switching back restores Huddle.
//
// Run:  node docs/playwright/sc4-space-rail.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => window.localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

const railItems = page.locator('nav.rail button.rail-item')
const count = await railItems.count()
check('every rail item is a button', count === 2, `buttons=${count}`)

const labels = await railItems.evaluateAll((els) => els.map((e) => e.textContent?.trim()))
check('rail shows both spaces', labels.join(',') === 'H,DA', `labels=${JSON.stringify(labels)}`)

const beforeCats = await page.locator('.cat-label').allTextContents()
check(
  'Huddle space shows its own categories',
  beforeCats.join(',') === 'Product,General',
  `categories=${JSON.stringify(beforeCats)}`,
)

// --- switch to the second space ---------------------------------------------
await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
await page.waitForTimeout(200)

const afterCats = await page.locator('.cat-label').allTextContents()
check(
  'switching swaps the sidebar to the other space',
  afterCats.join(',') === 'Reviews',
  `categories=${JSON.stringify(afterCats)}`,
)

const afterHeader = await page.locator('.channel .panel-header').innerText()
check('switch lands on that space’s first channel', afterHeader.includes('rule-reviews'), JSON.stringify(afterHeader))

const afterRows = await page.locator('.cat-channels .chan-row').allTextContents()
check(
  'the other space has its own channels',
  afterRows.length === 2 && afterRows.some((r) => r.includes('tenant-migration')),
  `rows=${JSON.stringify(afterRows)}`,
)

const activeRail = await page.locator('nav.rail button.rail-item--active').textContent()
check('the switched-to space is marked active', activeRail?.trim() === 'DA', `active=${JSON.stringify(activeRail?.trim())}`)

await page.screenshot({ path: 'docs/evidence/walk-sc4-space-switched.png' })

// --- switch back -------------------------------------------------------------
await page.locator('nav.rail button[aria-label="Switch to Huddle"]').click()
await page.waitForTimeout(200)

const backCats = await page.locator('.cat-label').allTextContents()
const backHeader = await page.locator('.channel .panel-header').innerText()
check(
  'switching back restores the Huddle space',
  backCats.join(',') === 'Product,General' && backHeader.includes('decision-app'),
  `categories=${JSON.stringify(backCats)} header=${JSON.stringify(backHeader)}`,
)

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
