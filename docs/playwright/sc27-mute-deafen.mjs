// SC27 — the voice panel's mute and deafen, as MODEL state only.
//
// There is no microphone, no media stream and no audio in this prototype. The
// criterion is deliberately about the model: `workspace.voice.muted` and
// `workspace.voice.deafened` flip from the panel's buttons, are independent of
// each other, and survive a reload. The walk proves the "nothing else" half by
// trapping `getUserMedia` before the app loads and requiring zero calls.
//
// Run:  node docs/playwright/sc27-mute-deafen.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity, freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

// Count any attempt to open a microphone, from before the app boots.
await page.addInitScript(() => {
  window.__mediaRequests = 0
  const media = navigator.mediaDevices
  if (media?.getUserMedia) {
    const original = media.getUserMedia.bind(media)
    media.getUserMedia = (...args) => {
      window.__mediaRequests += 1
      return original(...args)
    }
  }
})

await freshLoad(page, BASE)

const panel = page.locator('.sidebar [data-section="voice-panel"]')
const micButton = page.locator('.voice-panel [aria-label$="myself"]')
const deafenButton = page.locator('.voice-panel [aria-label="Deafen"], .voice-panel [aria-label="Undeafen"]')

const voice = () =>
  page.evaluate(() => {
    const settings = window.__huddle.state.workspace.voice
    return { muted: settings?.muted ?? false, deafened: settings?.deafened ?? false }
  })

// --- 1. no room, no panel ---------------------------------------------------
check('the panel is absent while not in a voice room', (await panel.count()) === 0, `panels=${await panel.count()}`)

// --- 2. joining a room reveals the panel ------------------------------------
await page.locator('[data-category="Product"] .chan-row').filter({ hasText: 'agent-platform' }).dblclick()
await page.waitForTimeout(300)
check('joining a room reveals the panel', (await panel.count()) === 1, `panels=${await panel.count()}`)

const roomLabel = await page.locator('.vp-room-name').innerText()
check('the panel names the room', roomLabel.trim() === 'agent-platform', JSON.stringify(roomLabel.trim()))

const stateLine = await page.locator('.vp-state').innerText()
check('the panel reads Voice Connected', stateLine.includes('Voice Connected'), JSON.stringify(stateLine.trim()))

// --- 3. mute -----------------------------------------------------------------
const start = await voice()
check('both preferences start off', !start.muted && !start.deafened, JSON.stringify(start))

await micButton.first().click()
await page.waitForTimeout(200)
const muted = await voice()
const micPressed = await page.locator('.voice-panel [aria-label="Unmute myself"]').getAttribute('aria-pressed')
const micClass = await page.locator('.voice-panel [aria-label="Unmute myself"]').getAttribute('class')
check(
  'the mic button sets muted and leaves deafen alone',
  muted.muted && !muted.deafened,
  JSON.stringify(muted),
)
check(
  'the muted button reads as pressed and carries the mute styling',
  micPressed === 'true' && (micClass ?? '').includes('vp-ic--mute'),
  `aria-pressed=${micPressed} class=${JSON.stringify(micClass)}`,
)

// --- 4. deafen ---------------------------------------------------------------
await deafenButton.first().click()
await page.waitForTimeout(200)
const both = await voice()
check(
  'the headphones button sets deafened and keeps mute',
  both.muted && both.deafened,
  JSON.stringify(both),
)

// --- 5. both survive a reload ------------------------------------------------
await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const reloaded = await voice()
check(
  'both preferences survive a reload',
  reloaded.muted === both.muted && reloaded.deafened === both.deafened,
  JSON.stringify(reloaded),
)
check('the panel is still there after the reload', (await panel.count()) === 1, `panels=${await panel.count()}`)

// --- 6. it is mock state: no microphone was ever opened --------------------
const mediaRequests = await page.evaluate(() => window.__mediaRequests)
const audioElements = await page.locator('audio, video').count()
check(
  'no microphone was opened — mute and deafen are mock state only',
  mediaRequests === 0 && audioElements === 0,
  `getUserMedia calls=${mediaRequests} audio/video elements=${audioElements}`,
)

// --- 7. hanging up hides the panel -----------------------------------------
await page.locator('.voice-panel [aria-label="Disconnect from voice"]').click()
await page.waitForTimeout(250)
check('hanging up hides the panel', (await panel.count()) === 0, `panels=${await panel.count()}`)

await page.screenshot({ path: 'docs/evidence/walk-sc27-mute-deafen.png' })
await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
