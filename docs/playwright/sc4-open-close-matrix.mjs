// SC4 — every open/close entry point, and what each one does to the model.
//
// The five entry points are exercised one by one, and the three view fields are
// re-read from the model after each: `activeThreadId`, `threadView` and
// `activeChannelId`. A close must leave the thread null and closed with the
// channel it was already on; a channel-row or rail click closes the thread and
// moves the channel; no close may leave an orphaned panel behind.
//
// Run:  node docs/playwright/sc4-open-close-matrix.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

/** The three view fields SC4 is about, read from the model. */
async function read() {
  return page.evaluate(() => {
    const state = window.__huddle.state
    return {
      channelId: state.activeChannelId,
      threadId: state.activeThreadId,
      view: state.threadView,
    }
  })
}

async function settle() {
  await page.waitForTimeout(220)
}

const panels = async () => ({
  thread: await page.locator('.thread').count(),
  channel: await page.locator('.channel').count(),
})

// --- 0. the seed starts with a thread open in split view ---------------------
const start = await read()
check(
  'the seed opens a thread in split view',
  start.view === 'split' && start.threadId === 'thr-thresholds' && start.channelId === 'decision-app',
  `view=${start.view} thread=${start.threadId} channel=${start.channelId}`,
)

// --- 1. thread expand: split → full -----------------------------------------
await page.locator('.thread button[aria-label="Expand thread"]').click()
await settle()
const full = await read()
check(
  'expanding the thread keeps the selection and moves the view to full',
  full.view === 'full' && full.threadId === start.threadId && full.channelId === start.channelId,
  `view=${full.view} thread=${full.threadId} channel=${full.channelId}`,
)
check(
  'full view renders the full-width shell',
  (await page.locator('.shell.shell--thread-full').count()) === 1,
  `shells=${await page.locator('.shell.shell--thread-full').count()}`,
)

// --- 2. thread breadcrumb: full → split -------------------------------------
await page.locator('.thread .breadcrumb').click()
await settle()
const restored = await read()
check(
  'the breadcrumb restores split view without losing the thread',
  restored.view === 'split' &&
    restored.threadId === start.threadId &&
    restored.channelId === start.channelId,
  `view=${restored.view} thread=${restored.threadId} channel=${restored.channelId}`,
)

// --- 3. close button: split → closed, channel unchanged ---------------------
await page.locator('.thread button[aria-label="Close thread"]').click()
await settle()
const closedByButton = await read()
const afterClosePanels = await panels()
check(
  'the close button nulls the thread, closes the view and keeps the channel',
  closedByButton.view === 'closed' &&
    closedByButton.threadId === null &&
    closedByButton.channelId === start.channelId,
  `view=${closedByButton.view} thread=${closedByButton.threadId} channel=${closedByButton.channelId}`,
)
check(
  'no orphaned thread panel is left behind',
  afterClosePanels.thread === 0 && afterClosePanels.channel === 1,
  `threadPanes=${afterClosePanels.thread} channelPanes=${afterClosePanels.channel}`,
)

// --- 4. thread card: closed → split -----------------------------------------
await page.locator('.channel .thread-card.thread-replies').first().click()
await settle()
const reopened = await read()
check(
  'the reply-count card reopens that thread in split view',
  reopened.view === 'split' && reopened.threadId === start.threadId,
  `view=${reopened.view} thread=${reopened.threadId}`,
)

// --- 5. sidebar channel row: closes the thread, moves the channel -----------
await page.locator('[data-category="Product"] .chan-row').filter({ hasText: 'agent-platform' }).click()
await settle()
const afterRow = await read()
const rowPanels = await panels()
check(
  'a sidebar channel row closes the open thread and selects that channel',
  afterRow.view === 'closed' &&
    afterRow.threadId === null &&
    afterRow.channelId === 'agent-platform',
  `view=${afterRow.view} thread=${afterRow.threadId} channel=${afterRow.channelId}`,
)
check(
  'the channel row leaves exactly one channel pane and no thread pane',
  rowPanels.thread === 0 && rowPanels.channel === 1,
  `threadPanes=${rowPanels.thread} channelPanes=${rowPanels.channel}`,
)

// --- 6. category → channel → thread, back in decision-app -------------------
await page.locator('[data-category="Product"] .chan-row').filter({ hasText: 'decision-app' }).click()
await settle()
await page.locator('.channel .thread-card.thread-replies').first().click()
await settle()
const viaPath = await read()
check(
  'category → channel → thread opens the thread of that channel',
  viaPath.view === 'split' &&
    viaPath.threadId === start.threadId &&
    viaPath.channelId === 'decision-app',
  `view=${viaPath.view} thread=${viaPath.threadId} channel=${viaPath.channelId}`,
)

// --- 7. space rail: closes the thread and lands on the other space ----------
await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
await settle()
const afterRail = await read()
check(
  'the space rail closes the thread and lands on the other space’s first channel',
  afterRail.view === 'closed' &&
    afterRail.threadId === null &&
    afterRail.channelId === 'rule-reviews',
  `view=${afterRail.view} thread=${afterRail.threadId} channel=${afterRail.channelId}`,
)

// Switching back lands the way a fresh load does — the space's first channel
// with its first thread open — because that is what `initialState` defines for a
// space. Leaving it closed would make the same click mean two different things
// depending on what happened before it.
await page.locator('nav.rail button[aria-label="Switch to Huddle"]').click()
await settle()
const backHome = await read()
check(
  'switching back lands where a fresh load does — first channel, first thread open',
  backHome.view === 'split' &&
    backHome.threadId === 'thr-thresholds' &&
    backHome.channelId === 'decision-app',
  `view=${backHome.view} thread=${backHome.threadId} channel=${backHome.channelId}`,
)

// --- 8. the create-channel popup opens and dismisses ------------------------
await page.locator('[data-category] .cat-row').first().hover()
await page.waitForTimeout(150)
await page.locator('button[aria-label="Create a channel"]').first().click()
await page.waitForTimeout(150)
const popupOpen = await page.locator('[data-category] form').count()
await page.locator('[data-category] button:has-text("Cancel")').first().click()
await page.waitForTimeout(150)
const popupClosed = await page.locator('[data-category] form').count()
check(
  'the create-channel popup opens and dismisses',
  popupOpen === 1 && popupClosed === 0,
  `open=${popupOpen} afterCancel=${popupClosed}`,
)

const afterPopup = await read()
check(
  'dismissing the popup changes no view state',
  afterPopup.view === backHome.view &&
    afterPopup.threadId === backHome.threadId &&
    afterPopup.channelId === backHome.channelId,
  `view=${afterPopup.view} thread=${afterPopup.threadId} channel=${afterPopup.channelId}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc4-open-close.png' })
await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
