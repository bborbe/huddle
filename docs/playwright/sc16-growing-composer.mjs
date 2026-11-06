// SC16 — the composer grows with its content, in both composers.
// Proves: one line at rest; five newlines grow it to five lines; deleting returns
// it to one; past the cap the height stops changing while scrollHeight keeps
// rising and the field scrolls internally.
//
// Run:  node docs/playwright/sc16-growing-composer.mjs

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

const COMPOSERS = [
  { label: 'channel', selector: '.channel .composer-field' },
  { label: 'thread', selector: '.thread .composer-field' },
]

const viewportHeight = await page.evaluate(() => window.innerHeight)
const cap = Math.round(viewportHeight / 3)

for (const { label, selector } of COMPOSERS) {
  const field = page.locator(selector)
  const exists = await field.count()
  check(`${label} composer is present`, exists === 1, `fields=${exists}`)
  if (exists !== 1) continue

  const metrics = await field.evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      height: Math.round(el.getBoundingClientRect().height),
      lineHeight: parseFloat(style.lineHeight),
      padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
    }
  })
  const lineHeight = metrics.lineHeight
  const rest = metrics.height
  const oneLine = Math.round(metrics.lineHeight + metrics.padding)

  check(
    `${label}: one line at rest`,
    Math.abs(rest - oneLine) <= 2,
    `height=${rest}px oneLine=${oneLine}px (line ${lineHeight}px + padding ${metrics.padding}px)`,
  )

  // five lines
  await field.fill('a\na\na\na\na')
  await page.waitForTimeout(150)
  const five = await field.evaluate((el) => Math.round(el.getBoundingClientRect().height))
  check(
    `${label}: five lines grow the field`,
    five >= rest + 3 * lineHeight,
    `rest=${rest}px five=${five}px lineHeight=${lineHeight}px`,
  )

  // deleting shrinks it back
  await field.fill('a')
  await page.waitForTimeout(150)
  const back = await field.evaluate((el) => Math.round(el.getBoundingClientRect().height))
  check(`${label}: deleting returns it to one line`, Math.abs(back - rest) <= 1, `rest=${rest}px back=${back}px`)

  // past the cap
  await field.fill(Array.from({ length: 80 }, (_, i) => `line ${i}`).join('\n'))
  await page.waitForTimeout(200)
  const capped = await field.evaluate((el) => ({
    height: Math.round(el.getBoundingClientRect().height),
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    overflowY: getComputedStyle(el).overflowY,
  }))

  check(
    `${label}: height stops at about a third of the viewport`,
    capped.height <= cap + 2,
    `height=${capped.height}px cap=${cap}px`,
  )

  check(
    `${label}: content past the cap is scrollable, not clipped`,
    capped.scrollHeight > capped.clientHeight && capped.overflowY === 'auto',
    `scrollHeight=${capped.scrollHeight} clientHeight=${capped.clientHeight} overflowY=${capped.overflowY}`,
  )

  await field.fill(Array.from({ length: 160 }, (_, i) => `line ${i}`).join('\n'))
  await page.waitForTimeout(200)
  const taller = await field.evaluate((el) => Math.round(el.getBoundingClientRect().height))
  check(`${label}: more content does not grow it further`, Math.abs(taller - capped.height) <= 2, `capped=${capped.height}px taller=${taller}px`)

  await field.fill('')
  await page.waitForTimeout(150)
}

await page.screenshot({ path: 'docs/evidence/walk-sc16-composer.png' })
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
