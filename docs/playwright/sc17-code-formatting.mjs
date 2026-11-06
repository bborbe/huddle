// SC17 — only inline code and fenced blocks render; everything else is literal.
// Proves: an inline span renders a <code> element, a fenced block renders
// <pre><code> with its newlines preserved, and `**bold**` renders as the literal
// characters.
//
// Run:  node docs/playwright/sc17-code-formatting.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const BODY = [
  'Use `npm run build` before you push.',
  '',
  '```',
  'npm ci',
  'npm run build',
  '```',
  '',
  'and **bold** stays literal, as does - item and # heading',
].join('\n')

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

const composer = page.locator('.channel .composer-field')
await composer.fill(BODY)
await page.locator('.channel .send-btn').click()
await page.waitForTimeout(300)

const sent = page.locator('.channel article.msg').last()

const inline = sent.locator('code.md-code')
const inlineCount = await inline.count()
const inlineText = inlineCount === 1 ? await inline.innerText() : ''
check('an inline span renders a <code> element', inlineCount === 1 && inlineText === 'npm run build', `count=${inlineCount} text=${JSON.stringify(inlineText)}`)

const block = sent.locator('pre.md-code-block code')
const blockCount = await block.count()
const blockText = blockCount === 1 ? await block.innerText() : ''
check(
  'a fenced block renders <pre><code> with newlines preserved',
  blockCount === 1 && blockText === 'npm ci\nnpm run build',
  `count=${blockCount} text=${JSON.stringify(blockText)}`,
)

const bodyText = await sent.locator('.msg-body').innerText()
check(
  '**bold** renders as the literal characters',
  bodyText.includes('**bold**') && !bodyText.includes('\u0000'),
  JSON.stringify(bodyText.split('\n').slice(-1)[0]),
)

check(
  'other markdown stays literal too (- item, # heading)',
  bodyText.includes('- item') && bodyText.includes('# heading'),
  `hasListItem=${bodyText.includes('- item')} hasHeading=${bodyText.includes('# heading')}`,
)

// The raw CommonMark is what is stored, so a channel adapter can re-map it.
const stored = await page.evaluate(() => {
  const raw = window.localStorage.getItem('huddle:v5')
  if (!raw) return null
  const state = JSON.parse(raw)
  const channel = state.workspace.channels.find((c) => c.id === 'decision-app')
  return channel?.messages?.slice(-1)?.[0]?.body ?? null
})
check(
  'the stored body is the raw CommonMark, not rendered HTML',
  stored === BODY,
  `storedMatches=${stored === BODY}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc17-code.png' })
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
