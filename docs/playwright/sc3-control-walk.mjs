// SC3 — no dead click anywhere.
//
// Walks every control in docs/control-inventory.md, in a state where it exists, and
// asserts it produces a real effect: a change in the model (read from
// window.__huddle.state) or a structural change in the DOM (element count). A
// control whose only delta is a CSS class or an attribute fails — that is the whole
// point of the criterion.
//
// Run:  node docs/playwright/sc3-control-walk.mjs

import { readFileSync } from 'node:fs'
import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { freshLoad } from './lib/fresh.mjs'
import { STATES } from './lib/states.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const union = JSON.parse(readFileSync('docs/evidence/control-union.json', 'utf8'))
const bySelector = new Map()
for (const [state, entries] of Object.entries(union)) {
  for (const entry of entries) {
    if (!bySelector.has(entry.selector)) bySelector.set(entry.selector, { ...entry, states: [] })
    bySelector.get(entry.selector).states.push(state)
  }
}
const rows = [...bySelector.values()].sort((a, b) => a.selector.localeCompare(b.selector))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

async function snapshot() {
  return page.evaluate(() => ({
    model: JSON.stringify(window.__huddle?.state ?? null),
    nodes: document.querySelectorAll('*').length,
  }))
}

// Some controls are inert by design until a precondition holds — a composer has
// text, a create button has a name, Reset has something to undo, and a space switch
// has somewhere to switch back from. The precondition is set here, not judged by eye
// in the assertion.
const PREPARE = {
  '.channel [aria-label="Send"]': async (page) => {
    await page.locator('.channel .composer-field').fill('probe message')
  },
  '.thread [aria-label="Send reply"]': async (page) => {
    await page.locator('.thread .composer-field').fill('probe reply')
  },
  '.sidebar [aria-label="Reset demo"]': async (page) => {
    await page.locator('.channel .composer-field').fill('probe message')
    await page.locator('.channel .send-btn').click()
    await page.waitForTimeout(250)
  },
  '[aria-label="Switch to Huddle"]': async (page) => {
    await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
    await page.waitForTimeout(250)
  },
  '[data-category="Product"] button:has-text("Create")': async (page) => {
    await page.locator('#new-channel-cat-product').fill('probe-channel')
    await page.waitForTimeout(100)
  },
  '[data-category="Product"] form:has-text("Create a channel in Prod")': async (page) => {
    await page.locator('#new-channel-cat-product').fill('probe-channel')
    await page.waitForTimeout(100)
  },
}

const results = []
let failures = 0

for (const row of rows) {
  const state = row.states[0]
  let verdict = 'FAIL'
  let delta = ''

  try {
    await freshLoad(page, BASE)
    await STATES[state](page)
    if (PREPARE[row.selector]) await PREPARE[row.selector](page)

    const locator = page.locator(row.selector).first()
    const resolved = await page.locator(row.selector).count()
    if (resolved !== 1) {
      // SC2's uniqueness rule: a row's selector must resolve to exactly one element
      // in each state it names.
      delta = `selector resolved to ${resolved} elements, expected exactly 1`
    } else {
      const before = await snapshot()

      if (row.tag === 'input' || row.tag === 'textarea') {
        await locator.fill('probe')
        const value = await locator.inputValue()
        verdict = value === 'probe' ? 'PASS' : 'FAIL'
        delta = `value=${JSON.stringify(value)}`
      } else if (row.tag === 'form') {
        const field = locator.locator('input').first()
        if ((await field.count()) === 0) {
          delta = 'form has no input to submit'
        } else {
          await field.press('Enter')
          await page.waitForTimeout(200)
          const after = await snapshot()
          const changed = after.model !== before.model || after.nodes !== before.nodes
          verdict = changed ? 'PASS' : 'FAIL'
          delta = `modelChanged=${after.model !== before.model} nodes ${before.nodes}→${after.nodes}`
        }
      } else {
        await locator.click({ timeout: 4000 })
        await page.waitForTimeout(250)
        const after = await snapshot()
        const modelChanged = after.model !== before.model
        const nodesChanged = after.nodes !== before.nodes
        verdict = modelChanged || nodesChanged ? 'PASS' : 'FAIL'
        delta = `modelChanged=${modelChanged} nodes ${before.nodes}→${after.nodes}`
      }
    }
  } catch (error) {
    delta = String(error instanceof Error ? error.message : error).split('\n')[0].slice(0, 120)
  }

  if (verdict !== 'PASS') failures += 1
  results.push({ row, state, verdict, delta })
  console.log(`${verdict}  ${row.selector}  [${state}]  — ${delta}`)
}

await browser.close()

console.log(`\n${rows.length - failures}/${rows.length} PASS, ${failures} FAIL across ${rows.length} inventory rows`)
process.exit(failures === 0 ? 0 : 1)
