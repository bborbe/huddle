// SC9 — message hover toolbar, quick reactions, and the `N replies` line.
// Proves: toolbar hidden at rest, visible on hover of a chosen message, an emoji
// lands on that message and no other (and survives a reload), reply opens the
// thread bound to that message, and the reply-count line reads that message's
// own count and opens the same pane.
//
// Run:  node docs/playwright/sc9-message-toolbar.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity, freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const TOOLBAR = '[role="toolbar"][aria-label="Message actions"]'

// decision-app is the seeded channel with both a plain message and a threaded one.
const PLAIN = 'Morning. The Decision App review page'
const THREADED = 'That is the sparse checkout'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

function msgRow(text) {
  return page.locator('article.msg').filter({ hasText: text }).first()
}

// --- 1. hidden at rest -------------------------------------------------------
const atRest = await page.locator(TOOLBAR).count()
check('toolbar hidden at rest', atRest === 0, `count=${atRest}`)

// --- 2. visible on hover of a chosen message, and only there -----------------
await msgRow(PLAIN).hover()
await page.waitForTimeout(150)
const onHover = await page.locator(TOOLBAR).count()
const insideChosen = await msgRow(PLAIN).locator(TOOLBAR).count()
check(
  'toolbar appears on hover, on the hovered message only',
  onHover === 1 && insideChosen === 1,
  `total=${onHover} inside chosen=${insideChosen}`,
)

const buttons = await msgRow(PLAIN).locator(`${TOOLBAR} button`).evaluateAll((els) =>
  els.map((e) => e.getAttribute('aria-label')),
)
check(
  'toolbar carries three reactions and a reply',
  JSON.stringify(buttons) === JSON.stringify(['React with 👍', 'React with 😊', 'React with 🚀', 'Reply in thread']),
  JSON.stringify(buttons),
)

await page.locator('nav.rail').hover()
await page.waitForTimeout(150)
check('toolbar disappears when the pointer leaves', (await page.locator(TOOLBAR).count()) === 0, 'count=0')

// --- 3. an emoji lands on that message and no other --------------------------
await msgRow(PLAIN).hover()
await page.waitForTimeout(150)
await msgRow(PLAIN).locator('button[aria-label="React with 👍"]').click()
await page.waitForTimeout(200)

const onChosen = await msgRow(PLAIN).locator('.reaction').count()
const thumbsAnywhere = await page.locator('.reaction').count()
check(
  'the reaction lands on that message and no other',
  onChosen === 1 && thumbsAnywhere === 1,
  `chips on chosen=${onChosen} chips in channel=${thumbsAnywhere}`,
)

const chipText = await msgRow(PLAIN).locator('.reaction').innerText()
check('the chip shows the emoji and a count of 1', chipText.replace(/\s+/g, '') === '👍1', JSON.stringify(chipText))

await page.screenshot({ path: 'docs/evidence/walk-sc9-toolbar.png' })

// --- survives a reload -------------------------------------------------------
await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const afterReload = await msgRow(PLAIN).locator('.reaction').count()
check('the reaction survives a reload', afterReload === 1, `chips on chosen=${afterReload}`)

// clicking it again removes it
await msgRow(PLAIN).hover()
await page.waitForTimeout(150)
await msgRow(PLAIN).locator('button[aria-label="React with 👍"]').click()
await page.waitForTimeout(200)
check('clicking the same reaction again removes it', (await msgRow(PLAIN).locator('.reaction').count()) === 0, 'chips=0')

// --- 4. the reply-count line reads that message's own count ------------------
const repliesLine = msgRow(THREADED).locator('.thread-replies')
const repliesText = await repliesLine.innerText()
check('the threaded message shows its own reply count', repliesText.trim() === '3 replies', JSON.stringify(repliesText))

await repliesLine.click()
await page.waitForTimeout(250)
const threadHeader = await page.locator('.thread .panel-header').innerText()
const threadParent = await page.locator('.thread .panel-body article.msg').first().innerText()
check(
  'the reply-count line opens that message’s thread',
  threadHeader.includes('team-scoped decisions') && threadParent.includes(THREADED),
  `header=${JSON.stringify(threadHeader.split('\n')[0])} parentMatches=${threadParent.includes(THREADED)}`,
)

await page.locator('.thread button[aria-label="Close thread"]').click()
await page.waitForTimeout(200)

// --- 5. the toolbar's reply opens the thread bound to that message -----------
await msgRow(PLAIN).hover()
await page.waitForTimeout(150)
await msgRow(PLAIN).locator('button[aria-label="Reply in thread"]').click()
await page.waitForTimeout(250)

const replyParent = await page.locator('.thread .panel-body article.msg').first().innerText()
check(
  'the reply action opens the thread bound to that message',
  replyParent.includes(PLAIN),
  `parentMatches=${replyParent.includes(PLAIN)}`,
)

const replyLine = await page.locator('.thread .replies-label').innerText()
check('a thread started by reply is empty', replyLine.trim() === '0 replies', JSON.stringify(replyLine))

// --- 6. placement: the toolbar sits beside the text, not at the pane edge -----
// A short, left-aligned message is the case that exposed this: pinned to the
// pane's right edge, the pointer had to cross the whole column to reach it.
await page.locator('.cat-channels .chan-row').filter({ hasText: 'random' }).first().click()
await page.waitForTimeout(200)
const shortMsg = page.locator('article.msg').filter({ hasText: 'The coffee machine is fixed.' }).first()
await shortMsg.hover()
await page.waitForTimeout(150)

const placement = await shortMsg.evaluate((row) => {
  const bodyRow = row.querySelector('.msg-body-row')
  const toolbar = row.querySelector('[role="toolbar"][aria-label="Message actions"]')
  const pane = row.closest('.panel-body')
  if (!bodyRow || !toolbar || !pane) return null
  const body = bodyRow.getBoundingClientRect()
  const bar = toolbar.getBoundingClientRect()
  const paneRect = pane.getBoundingClientRect()
  return {
    gapFromText: Math.round(bar.left - body.right),
    gapFromPaneEdge: Math.round(paneRect.right - bar.right),
    textWidth: Math.round(body.width),
    paneWidth: Math.round(paneRect.width),
  }
})

check(
  'the toolbar sits just past the message text',
  placement !== null && placement.gapFromText >= 0 && placement.gapFromText <= 24,
  `gapFromText=${placement?.gapFromText}px textWidth=${placement?.textWidth}px`,
)

check(
  'the toolbar is not pinned to the pane’s right edge',
  placement !== null && placement.gapFromPaneEdge > 80,
  `gapFromPaneEdge=${placement?.gapFromPaneEdge}px paneWidth=${placement?.paneWidth}px`,
)

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
