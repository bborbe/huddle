// SC11 — starred channels.
// Proves: no Starred section while nothing is starred; the section sits above the
// categories; starring pins the channel there, fills the header icon and flips the
// tooltip; the channel stays in its own category; two starred channels sort
// alphabetically; a reload keeps all of it; unstarring empties the icon.
//
// Run:  node docs/playwright/sc11-starred.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const STARRED = '[data-section="starred"]'

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

function categoryRow(category, channel) {
  return page.locator(`[data-category="${category}"] .chan-row`).filter({ hasText: channel })
}

function starredRows() {
  return page.locator(`${STARRED} .chan-row`)
}

async function openChannel(category, channel) {
  await categoryRow(category, channel).first().click()
  await page.waitForTimeout(150)
}

// --- 1. nothing starred ------------------------------------------------------
check('no Starred section while nothing is starred', (await page.locator(STARRED).count()) === 0, 'sections=0')

// --- 2. starring ------------------------------------------------------------
await openChannel('General', 'general')
const beforeStar = await page.locator('.channel .panel-header .star-btn').getAttribute('title')
check('the header star reads "Star" when unstarred', beforeStar === 'Star', `title=${JSON.stringify(beforeStar)}`)

await page.locator('.channel .panel-header .star-btn').click()
await page.waitForTimeout(200)

check('starring creates the Starred section', (await page.locator(STARRED).count()) === 1, 'sections=1')

const inStarred = await starredRows().filter({ hasText: 'general' }).count()
check('the starred channel appears in the Starred section', inStarred === 1, `rows=${inStarred}`)

const icon = await page.locator('.channel .panel-header .star-btn').innerText()
const title = await page.locator('.channel .panel-header .star-btn').getAttribute('title')
check('the header icon fills and the tooltip flips', icon.trim() === '★' && title === 'Unstar channel', `icon=${JSON.stringify(icon.trim())} title=${JSON.stringify(title)}`)

const stillInCategory = await categoryRow('General', 'general').count()
check('the channel stays in its own category', stillInCategory === 1, `rows=${stillInCategory}`)

const aboveCategories = await page.evaluate(() => {
  const starred = document.querySelector('[data-section="starred"]')
  const firstCategory = document.querySelector('[data-category]')
  if (!starred || !firstCategory) return null
  return starred.getBoundingClientRect().top < firstCategory.getBoundingClientRect().top
})
check('the Starred section renders above the categories', aboveCategories === true, `above=${aboveCategories}`)

// --- 3. two starred channels sort alphabetically ----------------------------
// The pair is chosen so array order and alphabetical order disagree: the seed
// stores decision-app before agent-platform, so only a real sort puts
// agent-platform first.
await openChannel('Product', 'decision-app')
await page.locator('.channel .panel-header .star-btn').click()
await page.waitForTimeout(200)
await openChannel('Product', 'agent-platform')
await page.locator('.channel .panel-header .star-btn').click()
await page.waitForTimeout(200)

const order = await starredRows().evaluateAll((els) => els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()))
check(
  'starred channels render alphabetically, not in starring or array order',
  JSON.stringify(order) === JSON.stringify(['agent-platform', 'decision-app', 'general']),
  JSON.stringify(order),
)

await page.screenshot({ path: 'docs/evidence/walk-sc11-starred.png' })

// --- 4. survives a reload ---------------------------------------------------
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(200)
const afterReload = await starredRows().evaluateAll((els) => els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()))
check('the starred set survives a reload', JSON.stringify(afterReload) === JSON.stringify(['agent-platform', 'decision-app', 'general']), JSON.stringify(afterReload))

// --- 5. unstarring ----------------------------------------------------------
await openChannel('General', 'general')
await page.locator('.channel .panel-header .star-btn').click()
await page.waitForTimeout(200)

const afterUnstar = await starredRows().evaluateAll((els) => els.map((el) => (el.textContent ?? '').replace(/^[A-Z]{2}/, '').trim()))
const iconAfter = await page.locator('.channel .panel-header .star-btn').innerText()
check(
  'unstarring removes it from the section and empties the icon',
  JSON.stringify(afterUnstar) === JSON.stringify(['agent-platform', 'decision-app']) && iconAfter.trim() === '☆',
  `section=${JSON.stringify(afterUnstar)} icon=${JSON.stringify(iconAfter.trim())}`,
)

await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
