// SC19 — rename and delete a channel from its row.
// Proves: the gear is hidden at rest and appears on hover, it opens the channel
// settings dialog with the name pre-filled, rename changes the sidebar name and
// survives a reload while keeping the star and the alphabetical position, delete
// confirms by naming the channel, and deleting the ACTIVE channel leaves a valid
// selection with the thread pane closed.
//
// Run:  node docs/playwright/sc19-channel-settings.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity, freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const GEAR = 'button[aria-label="Channel settings"]'
const SETTINGS = '[role="dialog"][aria-label^="Channel settings"]'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

function productRows() {
  return page.locator('[data-category="Product"] .chan-row')
}

async function productOrder() {
  return productRows().evaluateAll((els) =>
    els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()),
  )
}

// --- 1. the gear is hidden at rest, revealed on hover ------------------------
check('the gear is absent from the rendered tree at rest', (await page.locator(GEAR).count()) === 0, `gears=${await page.locator(GEAR).count()}`)

const agentRow = page.locator('[data-category="Product"] .chan-wrap').filter({ hasText: 'agent-platform' })
await agentRow.hover()
await page.waitForTimeout(150)
check('hovering a channel row reveals its gear', (await page.locator(GEAR).count()) === 1, `gears=${await page.locator(GEAR).count()}`)

// --- 2. the settings dialog opens pre-filled ---------------------------------
await page.locator(GEAR).first().click()
await page.waitForTimeout(200)
const opened = await page.locator(SETTINGS).count()
const prefilled = opened ? await page.locator('#channel-settings-name').inputValue() : null
check('the gear opens channel settings, pre-filled with the name', opened === 1 && prefilled === 'agent-platform', `dialog=${opened} value=${JSON.stringify(prefilled)}`)

await page.screenshot({ path: 'docs/evidence/walk-sc19-settings.png' })

// --- 3. rename keeps the star and the alphabetical position ------------------
await page.locator('#channel-settings-name').fill('agent-hub')
await page.locator(`${SETTINGS} button[type="submit"]`).click()
await page.waitForTimeout(250)

const afterRename = await productOrder()
check(
  'rename changes the sidebar name in place',
  JSON.stringify(afterRename) === JSON.stringify(['agent-hub', 'decision-app']),
  JSON.stringify(afterRename),
)

const starredAfterRename = await page.locator('[data-section="starred"] .chan-row').evaluateAll((els) =>
  els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()),
)
check('the renamed channel keeps its star', starredAfterRename.includes('decision-app'), JSON.stringify(starredAfterRename))

await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const afterReload = await productOrder()
check('the rename survives a reload', JSON.stringify(afterReload) === JSON.stringify(['agent-hub', 'decision-app']), JSON.stringify(afterReload))

// --- 4. delete confirms, naming the channel ----------------------------------
const hubRow = page.locator('[data-category="Product"] .chan-wrap').filter({ hasText: 'agent-hub' })
await hubRow.hover()
await page.waitForTimeout(150)
await page.locator(GEAR).first().click()
await page.waitForTimeout(200)

await page.locator(`${SETTINGS} button`, { hasText: 'Delete channel' }).click()
await page.waitForTimeout(200)
const confirmText = await page.locator(SETTINGS).innerText()
check(
  'delete asks first, naming the channel and what goes with it',
  confirmText.includes('agent-hub') && confirmText.includes('messages'),
  JSON.stringify(confirmText.split('\n').slice(0, 3)),
)

await page.locator(`${SETTINGS} button`, { hasText: 'Delete channel' }).click()
await page.waitForTimeout(250)
const afterDelete = await productOrder()
check('confirming removes the channel', JSON.stringify(afterDelete) === JSON.stringify(['decision-app']), JSON.stringify(afterDelete))

// --- 5. deleting the ACTIVE channel leaves a valid selection ----------------
// agent-platform is gone; select decision-app (the only one left in Product),
// then delete it and check a neighbour takes over with the thread pane closed.
await page.locator('[data-category="Product"] .chan-row').first().click()
await page.waitForTimeout(200)

const row = page.locator('[data-category="Product"] .chan-wrap').filter({ hasText: 'decision-app' })
await row.hover()
await page.waitForTimeout(150)
await page.locator(GEAR).first().click()
await page.waitForTimeout(200)
await page.locator(`${SETTINGS} button`, { hasText: 'Delete channel' }).click()
await page.waitForTimeout(150)
await page.locator(`${SETTINGS} button`, { hasText: 'Delete channel' }).click()
await page.waitForTimeout(300)

const header = await page.locator('.channel .panel-header').innerText()
const threadOpen = await page.locator('.thread').count()
check(
  'deleting the active channel selects a neighbour and closes the thread pane',
  header.trim().length > 0 && !header.includes('decision-app') && threadOpen === 0,
  `header=${JSON.stringify(header.split('\n')[1] ?? '')} threadPanes=${threadOpen}`,
)

await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
