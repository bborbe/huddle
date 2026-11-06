// SC18 — the seed demonstrates every supported feature on a fresh browser.
// One assertion per row of docs/seed-coverage.md, all on first load with no user
// action beyond dismissing the first-run dialog.
//
// Run:  node docs/playwright/sc18-seed-coverage.mjs

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

// --- starred section --------------------------------------------------------
const starredRows = await page.locator('[data-section="starred"] .chan-row').evaluateAll((els) =>
  els.map((el) => (el.querySelector('.chan-name')?.textContent ?? '').trim()),
)
check('a channel is starred, so the Starred section renders', starredRows.length >= 1, JSON.stringify(starredRows))

// --- all three quick reactions on one message -------------------------------
const reactionChips = await page.locator('.channel .reaction').evaluateAll((els) =>
  els.map((el) => (el.querySelector('.reaction-emoji')?.textContent ?? '').trim()),
)
const hasAllThree = ['👍', '😊', '🚀'].every((emoji) => reactionChips.includes(emoji))
check('one message carries all three quick reactions', hasAllThree, JSON.stringify(reactionChips))

// --- a thread with replies --------------------------------------------------
const replyLines = await page.locator('.thread-replies').evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()))
check('a thread shows its reply count on first load', replyLines.includes('3 replies'), JSON.stringify(replyLines))

// --- tool calls (decision-app carries them) --------------------------------
const toolCards = await page.locator('.channel .tool').count()
check('the seed carries tool call cards', toolCards >= 1, `cards=${toolCards}`)

// --- inline code and a fenced block -----------------------------------------
await page.locator('.cat-channels .chan-row').filter({ hasText: 'agent-platform' }).first().click()
await page.waitForTimeout(200)

const inlineCode = await page.locator('.channel code.md-code').evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()))
check('the seed carries inline code', inlineCode.length >= 1, JSON.stringify(inlineCode.slice(0, 3)))

const blockText = await page.locator('.channel pre.md-code-block code').evaluateAll((els) => els.map((el) => el.textContent ?? ''))
check(
  'the seed carries a fenced code block with its newlines',
  blockText.length === 1 && blockText[0].includes('\n'),
  `blocks=${blockText.length} hasNewline=${blockText[0]?.includes('\n') ?? false}`,
)

// --- channels in every category, in every space -----------------------------
async function categoriesInActiveSpace() {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-category]')].map((section) => ({
      category: section.getAttribute('data-category'),
      channels: section.querySelectorAll('.chan-row').length,
    })),
  )
}

const huddleCategories = await categoriesInActiveSpace()
await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
await page.waitForTimeout(250)
const decisionCategories = await categoriesInActiveSpace()

const allCategories = [...huddleCategories, ...decisionCategories]
const emptyCategory = allCategories.find((entry) => entry.channels === 0)
check(
  'every category carries at least one channel',
  allCategories.length >= 3 && !emptyCategory,
  JSON.stringify(allCategories),
)

await page.locator('nav.rail button[aria-label="Switch to Huddle"]').click()
await page.waitForTimeout(200)

// --- tool calls -------------------------------------------------------------
// --- voice presence ---------------------------------------------------------
const voiceStrips = await page.locator('.voice-line, .voice-bar').count()
check('the seed shows members in voice', voiceStrips >= 1, `voiceIndicators=${voiceStrips}`)

// --- two spaces -------------------------------------------------------------
const railLabels = await page.locator('nav.rail button.rail-item').evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()))
check('both spaces are present', railLabels.length === 2, JSON.stringify(railLabels))

await page.screenshot({ path: 'docs/evidence/walk-sc18-seed-coverage.png' })
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
