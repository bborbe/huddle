// SC2 — enumerate the control population from the rendered page, across every
// state that renders controls, and save the raw union.
//
// Writes docs/evidence/control-union.json keyed by state: one entry per state,
// each holding the selectors found in that state. A state that was never
// exercised shows up as a missing key rather than as a quietly smaller union.
//
// Run:  node docs/playwright/enumerate.mjs

import { writeFileSync } from 'node:fs'
import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { freshLoad } from './lib/fresh.mjs'
import { STATES, STATE_NAMES, selectorFor } from './lib/states.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const QUERY = 'button, a, input, textarea, select, form, [role="button"]'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const union = {}

for (const state of STATE_NAMES) {
  await freshLoad(page, BASE)
  await STATES[state](page)

  const found = await page.evaluate(
    ({ query, stateName, src }) => {
      const build = new Function(`return (${src})`)()
      return [...document.querySelectorAll(query)]
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        .map((element) => ({
          selector: build(element),
          name: (element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 60),
          tag: element.tagName.toLowerCase(),
          state: stateName,
        }))
    },
    { query: QUERY, stateName: state, src: selectorFor.toString() },
  )

  union[state] = found
  console.log(`${state}: ${found.length} controls`)
}

await browser.close()

writeFileSync('docs/evidence/control-union.json', `${JSON.stringify(union, null, 2)}\n`)

const empty = STATE_NAMES.filter((state) => (union[state] ?? []).length === 0)
const total = Object.values(union).reduce((sum, list) => sum + list.length, 0)
console.log(`\n${STATE_NAMES.length} states, ${total} entries, ${empty.length} empty`)

if (empty.length > 0) {
  console.error(`States with no controls: ${empty.join(', ')}`)
  process.exit(1)
}
