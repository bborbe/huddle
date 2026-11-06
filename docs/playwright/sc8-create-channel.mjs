// SC8 — create-channel is the Slack affordance.
// Proves the three states (absent at rest / present on hover / popup creates a
// channel that survives a reload) against the running app.
//
// Run:  node docs/playwright/sc8-create-channel.mjs
// Requires the dev server on http://localhost:5173 (override with HUDDLE_URL).

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const NAME = 'launch-plan'
const ADD = 'button[aria-label="Create a channel"]'

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

// --- state 1: absent at rest -------------------------------------------------
const atRest = await page.locator(ADD).count()
check('create button absent from the rendered tree at rest', atRest === 0, `count=${atRest}`)

// --- state 2: present on category-row hover ----------------------------------
const catRow = page.locator('section.cat').first().locator('.cat-row')
await catRow.hover()
await page.waitForTimeout(200)
const onHover = await page.locator(ADD).count()
check('create button present while its category row is hovered', onHover === 1, `count=${onHover}`)

const title = onHover === 1 ? await page.locator(ADD).first().getAttribute('title') : null
check('tooltip reads "Create a channel"', title === 'Create a channel', `title=${JSON.stringify(title)}`)

// --- state 3: popup takes a name and creates --------------------------------
await page.locator(ADD).first().click()
await page.waitForTimeout(150)
const popupVisible = await page.locator('form.cat-popup').isVisible()
check('click opens the create-channel popup', popupVisible, 'form.cat-popup visible')

const focused = await page.evaluate(() => document.activeElement?.className ?? '')
check('popup input takes focus', focused.includes('cat-popup-input'), `activeElement.class=${focused}`)

await page.screenshot({ path: 'docs/evidence/walk-sc8-popup-open.png' })

await page.locator('form.cat-popup input').fill(NAME)
await page.locator('form.cat-popup input').press('Enter')
await page.waitForTimeout(250)

const popupCount = await page.locator('form.cat-popup').count()
check('popup closes after submit', popupCount === 0, `count=${popupCount}`)

const inSidebar = await page.locator('.cat-channels .chan-row', { hasText: NAME }).count()
check('new channel appears in the sidebar', inSidebar === 1, `rows matching ${NAME}=${inSidebar}`)

const header = await page.locator('.channel .panel-header').innerText()
check('new channel becomes the active channel', header.includes(NAME), JSON.stringify(header))

const catOf = await page.evaluate((name) => {
  for (const section of document.querySelectorAll('section.cat')) {
    const label = section.querySelector('.cat-label')?.textContent?.trim() ?? null
    const rows = [...section.querySelectorAll('.chan-row')].map((r) => r.textContent ?? '')
    if (rows.some((r) => r.includes(name))) return label
  }
  return null
}, NAME)
check('created inside the hovered category', catOf === 'Product', `category=${JSON.stringify(catOf)}`)

// --- survives a reload -------------------------------------------------------
await page.reload({ waitUntil: 'networkidle' })
const afterReload = await page.locator('.cat-channels .chan-row', { hasText: NAME }).count()
check('new channel survives a reload', afterReload === 1, `rows matching ${NAME}=${afterReload}`)

await page.screenshot({ path: 'docs/evidence/walk-sc8-create-channel.png' })

// --- Reset demo restores the seed -------------------------------------------
await page.locator('button[aria-label="Reset demo"]').click()
await page.waitForTimeout(250)
const afterReset = await page.locator('.cat-channels .chan-row', { hasText: NAME }).count()
check('Reset demo restores the seed', afterReset === 0, `rows matching ${NAME}=${afterReset}`)

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
