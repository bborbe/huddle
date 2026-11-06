// SC8 — create-channel is the Slack affordance, on EVERY category row.
// Proves the three states per row: absent at rest, present only on the hovered
// row, and the popup creates a channel in that category which survives a reload.
//
// Run:  node docs/playwright/sc8-create-channel.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const ADD = 'button[aria-label="Create a channel"]'

// Every category row the sidebar can render, with the space it lives in and the
// channel each one is asked to create.
const CATEGORIES = [
  { space: 'Huddle', category: 'Product', channel: 'alpha-plan' },
  { space: 'Huddle', category: 'General', channel: 'beta-plan' },
  { space: 'Decision App', category: 'Reviews', channel: 'gamma-plan' },
]

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

async function switchSpace(name) {
  const current = await page.locator('nav.rail button.rail-item--active').textContent()
  const initials = { Huddle: 'H', 'Decision App': 'DA' }[name]
  if (current?.trim() === initials) return
  await page.locator(`nav.rail button[aria-label="Switch to ${name}"]`).click()
  await page.waitForTimeout(200)
}

/** The category row element for a label, in the active space. */
function catRow(category) {
  return page.locator('section.cat').filter({ has: page.locator(`.cat-label:text-is("${category}")`) })
}

// --- state 1: absent at rest -------------------------------------------------
const atRest = await page.locator(ADD).count()
check('create button absent from the rendered tree at rest', atRest === 0, `count=${atRest}`)

// --- state 2: present on the hovered row, and only there ---------------------
for (const { space, category } of CATEGORIES) {
  await switchSpace(space)

  const rows = page.locator('section.cat')
  const total = await rows.count()
  const target = catRow(category)
  await target.locator('.cat-row').hover()
  await page.waitForTimeout(150)

  const onHover = await page.locator(ADD).count()
  const insideTarget = await target.locator(ADD).count()
  check(
    `${category}: button appears on the hovered row only`,
    onHover === 1 && insideTarget === 1,
    `total=${onHover} inside ${category}=${insideTarget} of ${total} rows`,
  )

  const title = await target.locator(ADD).getAttribute('title')
  check(`${category}: tooltip reads "Create a channel"`, title === 'Create a channel', `title=${JSON.stringify(title)}`)

  // leaving the row removes it again
  await page.locator('nav.rail').hover()
  await page.waitForTimeout(150)
  const afterLeave = await page.locator(ADD).count()
  check(`${category}: button disappears when the pointer leaves`, afterLeave === 0, `count=${afterLeave}`)
}

// --- state 3: the popup creates in that category -----------------------------
for (const { space, category, channel } of CATEGORIES) {
  await switchSpace(space)
  const target = catRow(category)

  await target.locator('.cat-row').hover()
  await page.waitForTimeout(150)
  await page.locator(ADD).first().click()
  await page.waitForTimeout(150)

  const popupVisible = await page.locator('form.cat-popup').isVisible()
  const focused = await page.evaluate(() => document.activeElement?.className ?? '')
  check(`${category}: click opens the popup with focus in its input`, popupVisible && focused.includes('cat-popup-input'), `visible=${popupVisible} activeElement=${focused}`)

  // An empty name must not be a silent cancel: Create is disabled, and forcing a
  // click on it leaves the popup open rather than dismissing it.
  const createBtn = page.locator('form.cat-popup button[type="submit"]')
  check(`${category}: Create is disabled while the name is empty`, await createBtn.isDisabled(), `disabled=${await createBtn.isDisabled()}`)
  await createBtn.click({ force: true }).catch(() => {})
  await page.waitForTimeout(150)
  check(`${category}: an empty name leaves the popup open`, await page.locator('form.cat-popup').isVisible(), `popupVisible=${await page.locator('form.cat-popup').isVisible()}`)

  if (category === 'Product') {
    await page.screenshot({ path: 'docs/evidence/walk-sc8-popup-open.png' })
  }

  await page.locator('form.cat-popup input').fill(channel)
  await page.waitForTimeout(100)
  check(`${category}: Create enables once a name is typed`, !(await createBtn.isDisabled()), `disabled=${await createBtn.isDisabled()}`)
  await page.locator('form.cat-popup input').press('Enter')
  await page.waitForTimeout(250)

  const popupGone = (await page.locator('form.cat-popup').count()) === 0
  const inThatCategory = await target.locator('.chan-row', { hasText: channel }).count()
  const header = await page.locator('.channel .panel-header').innerText()
  check(
    `${category}: the popup creates ${channel} in that category`,
    popupGone && inThatCategory === 1 && header.includes(channel),
    `popupGone=${popupGone} rowsInCategory=${inThatCategory} headerHas=${header.includes(channel)}`,
  )
}

await page.screenshot({ path: 'docs/evidence/walk-sc8-create-channel.png' })

// --- survives a reload -------------------------------------------------------
await page.reload({ waitUntil: 'networkidle' })
let allPersisted = true
for (const { space, category, channel } of CATEGORIES) {
  await switchSpace(space)
  const found = await catRow(category).locator('.chan-row', { hasText: channel }).count()
  if (found !== 1) allPersisted = false
}
check('all three channels survive a reload, each in its own category', allPersisted, 'checked Product/General/Reviews')

// --- Reset demo restores the seed -------------------------------------------
await page.locator('button[aria-label="Reset demo"]').click()
await page.waitForTimeout(250)
let allGone = true
for (const { space, category, channel } of CATEGORIES) {
  await switchSpace(space)
  const found = await catRow(category).locator('.chan-row', { hasText: channel }).count()
  if (found !== 0) allGone = false
}
check('Reset demo restores the seed', allGone, 'no created channel left in any category')

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
