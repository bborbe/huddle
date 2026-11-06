// SC15 — first-run identity.
// Proves: fresh storage shows the dialog; typing updates the preview; Start
// persists across reload and the message attribution changes; Skip dismisses and
// the app renders exactly as today, with the dialog back on the next load.
//
// Run:  node docs/playwright/sc15-identity.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const DIALOG = '[role="dialog"][aria-label="Set up your name"]'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

async function freshLoad() {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

// --- 1. fresh storage shows the dialog --------------------------------------
await freshLoad()
check('fresh storage shows the identity dialog', (await page.locator(DIALOG).count()) === 1, `dialogs=${await page.locator(DIALOG).count()}`)

const emptyPreview = await page.locator('.chan-tile--preview').innerText()
check('the preview is empty before a name is typed', emptyPreview.trim() === '??', JSON.stringify(emptyPreview.trim()))

// --- 2. typing updates the preview ------------------------------------------
await page.locator('.dialog-input').fill('Ben')
await page.waitForTimeout(150)
const preview = await page.locator('.chan-tile--preview').innerText()
const tokenBefore = await page.locator('.chan-tile--preview').getAttribute('data-token')
check('typing updates the preview initials', preview.trim() === 'BE', JSON.stringify(preview.trim()))

await page.locator('.dialog button', { hasText: 'Shuffle colour' }).click()
await page.waitForTimeout(150)
const tokenAfter = await page.locator('.chan-tile--preview').getAttribute('data-token')
check('the shuffle changes the colour token', tokenBefore !== tokenAfter, `${tokenBefore} → ${tokenAfter}`)

await page.screenshot({ path: 'docs/evidence/walk-sc15-dialog.png' })

// --- 3. Start persists and the attribution changes --------------------------
await page.locator('.dialog button[type="submit"]').click()
await page.waitForTimeout(250)
check('Start dismisses the dialog', (await page.locator(DIALOG).count()) === 0, `dialogs=${await page.locator(DIALOG).count()}`)

await page.locator('.composer-field').first().fill('hello from me')
await page.locator('.composer-field').first().press('Enter')
await page.waitForTimeout(250)

const authorName = await page.locator('.channel article.msg').last().locator('.msg-name').innerText()
check('a sent message is attributed to the chosen name', authorName.trim() === 'Ben', JSON.stringify(authorName.trim()))

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(250)
const dialogAfterReload = await page.locator(DIALOG).count()
const authorAfterReload = await page.locator('.channel article.msg').last().locator('.msg-name').innerText()
check(
  'the identity survives a reload and the attribution holds',
  dialogAfterReload === 0 && authorAfterReload.trim() === 'Ben',
  `dialogs=${dialogAfterReload} author=${JSON.stringify(authorAfterReload.trim())}`,
)

// --- 4. Skip dismisses, renders as today, and returns next load -------------
await freshLoad()
check('the dialog is back after fresh storage', (await page.locator(DIALOG).count()) === 1, 'dialogs=1')

await page.locator('.dialog button', { hasText: 'Skip' }).click()
await page.waitForTimeout(250)

const skippedDialogs = await page.locator(DIALOG).count()
const categories = await page.locator('.cat-label').allTextContents()
const channels = await page.locator('.cat-channels .chan-row').count()
check(
  'Skip dismisses and the app renders exactly as today',
  skippedDialogs === 0 && categories.join(',') === 'Product,General' && channels === 4,
  `dialogs=${skippedDialogs} categories=${JSON.stringify(categories)} channels=${channels}`,
)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(250)
check('Skip is not persisted — the dialog returns on the next load', (await page.locator(DIALOG).count()) === 1, `dialogs=${await page.locator(DIALOG).count()}`)

await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
