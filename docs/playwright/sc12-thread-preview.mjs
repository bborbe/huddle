// SC12 — sidebar thread previews stay on one line.
// Proves: a long preview truncates (scrollWidth > clientWidth), its row is exactly
// one line tall, and it does not push the rows below it down any further than a
// short preview does.
//
// Run:  node docs/playwright/sc12-thread-preview.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const LONG_MESSAGE = 'Checking. The deployed image is'

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

// decision-app seeds one short thread row; replying to a long message adds a long one.
const shortRow = page.locator('.thread-row').filter({ hasText: 'team-scoped decisions' })
const shortMetrics = await shortRow.evaluate((el) => {
  const name = el.querySelector('.thread-row-name')
  return {
    height: el.getBoundingClientRect().height,
    clientHeight: el.clientHeight,
    scrollWidth: name?.scrollWidth ?? 0,
    clientWidth: name?.clientWidth ?? 0,
    title: el.getAttribute('title'),
  }
})

await page.locator('article.msg').filter({ hasText: LONG_MESSAGE }).first().hover()
await page.waitForTimeout(150)
await page.locator('article.msg').filter({ hasText: LONG_MESSAGE }).first()
  .locator('button[aria-label="Reply in thread"]').click()
await page.waitForTimeout(300)

const longRow = page.locator('.thread-row').filter({ hasText: LONG_MESSAGE }).first()
const longCount = await longRow.count()
check('the long thread preview renders as a sidebar row', longCount === 1, `rows=${longCount}`)

const longMetrics = await longRow.evaluate((el) => {
  const name = el.querySelector('.thread-row-name')
  return {
    height: el.getBoundingClientRect().height,
    clientHeight: el.clientHeight,
    scrollWidth: name?.scrollWidth ?? 0,
    clientWidth: name?.clientWidth ?? 0,
    title: el.getAttribute('title'),
  }
})

check(
  'the long preview overflows horizontally (so it is genuinely truncated)',
  longMetrics.scrollWidth > longMetrics.clientWidth,
  `scrollWidth=${longMetrics.scrollWidth} clientWidth=${longMetrics.clientWidth}`,
)

check(
  'the short preview does not overflow',
  shortMetrics.scrollWidth <= shortMetrics.clientWidth,
  `scrollWidth=${shortMetrics.scrollWidth} clientWidth=${shortMetrics.clientWidth}`,
)

check(
  'the long preview row is exactly one line tall, like the short one',
  longMetrics.clientHeight === shortMetrics.clientHeight,
  `long=${longMetrics.clientHeight}px short=${shortMetrics.clientHeight}px`,
)

check(
  'the full text is reachable through the row title',
  (longMetrics.title ?? '').includes(LONG_MESSAGE),
  `title=${JSON.stringify(longMetrics.title)}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc12-thread-preview.png' })

// The row below must not be pushed down by a wrapped line. Measure against a
// plain channel row rather than "the next element", since a category boundary can
// legitimately sit between two rows.
const rowHeights = await page.evaluate(() => {
  const channel = document.querySelector('.chan-row')
  return { channel: channel ? Math.round(channel.getBoundingClientRect().height) : 0 }
})

check(
  'the long preview is one standard row tall, so nothing below it is pushed down',
  longMetrics.height === rowHeights.channel && shortMetrics.height === rowHeights.channel,
  `long=${longMetrics.height}px short=${shortMetrics.height}px channelRow=${rowHeights.channel}px`,
)

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
