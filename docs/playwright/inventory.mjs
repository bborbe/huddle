// Generates docs/control-inventory.md from docs/evidence/control-union.json.
//
// One row per element of the across-states union, with the states it exists in and
// the effect it must produce. Regenerate after any UI change:
//
//   node docs/playwright/enumerate.mjs && node docs/playwright/inventory.mjs

import { readFileSync, writeFileSync } from 'node:fs'

const union = JSON.parse(readFileSync('docs/evidence/control-union.json', 'utf8'))

/** The effect class the walk will assert for this control. */
function effectFor(entry) {
  if (entry.tag === 'input' || entry.tag === 'textarea') {
    return 'receives focus and accepts typed text (value reflected in the DOM)'
  }
  if (entry.tag === 'form') {
    return 'submitting (Enter in its input) creates or saves, and closes the popup'
  }
  if (entry.tag === 'select') return 'changes the model field it binds'
  return 'model delta or DOM insertion — asserted by the walk, never by eye'
}

const bySelector = new Map()
for (const [state, entries] of Object.entries(union)) {
  for (const entry of entries) {
    const existing = bySelector.get(entry.selector)
    if (existing) {
      if (!existing.states.includes(state)) existing.states.push(state)
      continue
    }
    bySelector.set(entry.selector, {
      selector: entry.selector,
      name: entry.name || '(unnamed)',
      tag: entry.tag,
      states: [state],
    })
  }
}

const rows = [...bySelector.values()].sort((a, b) => a.selector.localeCompare(b.selector))
const stateCount = Object.keys(union).length

const lines = [
  '# Control inventory',
  '',
  'Every control the app renders, one row per element of the union across rendering',
  'states. Generated from `docs/evidence/control-union.json` — regenerate with',
  '`node docs/playwright/enumerate.mjs && node docs/playwright/inventory.mjs` after any',
  'UI change, never by hand.',
  '',
  `**${rows.length} rows** across **${stateCount} states**. States: ${Object.keys(union).join(', ')}.`,
  '',
  '| # | Control | Selector | States | Effect |',
  '|---|---|---|---|---|',
]

rows.forEach((row, index) => {
  const name = row.name.replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const selector = `\`${row.selector.replace(/\|/g, '\\|')}\``
  lines.push(`| ${index + 1} | ${name} | ${selector} | ${row.states.join(', ')} | ${effectFor(row)} |`)
})

lines.push('')
writeFileSync('docs/control-inventory.md', `${lines.join('\n')}`)

console.log(`${rows.length} rows written to docs/control-inventory.md across ${stateCount} states`)
