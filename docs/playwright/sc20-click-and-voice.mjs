// SC20 — single click opens a channel, double click joins its voice.
// Proves: a single click changes the active channel with voice unchanged; a double
// click leaves the user in that channel's voice with the voice bar showing it; a
// second double click leaves voice.
//
// Run:  node docs/playwright/sc20-click-and-voice.mjs

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

function channelRow(name) {
  return page.locator('[data-category] .chan-row').filter({ hasText: name }).first()
}

async function activeHeader() {
  return (await page.locator('.channel .panel-header').innerText()).split('\n')[1]?.trim() ?? ''
}

// Read the model, not a button label: the header's Join/Leave buttons were
// removed, and a label could only ever describe the active channel anyway.
// This asks the question the criterion asks — is the local member in voice,
// and in which room — for the whole workspace.
async function voiceState() {
  return page.evaluate(() => {
    const rooms = []
    for (const channel of window.__huddle.state.workspace.channels) {
      if (channel.voiceMemberIds.includes('you')) rooms.push(channel.id)
      for (const thread of channel.threads) {
        if (thread.voiceMemberIds.includes('you')) rooms.push(`${channel.id}/${thread.id}`)
      }
    }
    return { rooms, inVoice: rooms.length > 0 }
  })
}

// --- 1. a single click opens the channel and does not touch voice -----------
const before = await voiceState()
await channelRow('general').click()
await page.waitForTimeout(200)

const afterSingleHeader = await activeHeader()
const afterSingleVoice = await voiceState()
check(
  'a single click changes the active channel',
  afterSingleHeader === 'general',
  `header=${JSON.stringify(afterSingleHeader)}`,
)
check(
  'a single click leaves voice unchanged',
  afterSingleVoice.inVoice === before.inVoice,
  `${JSON.stringify(before.rooms)} → ${JSON.stringify(afterSingleVoice.rooms)}`,
)

// --- 2. a double click joins that channel's voice ---------------------------
await channelRow('random').dblclick()
await page.waitForTimeout(250)

const afterDoubleHeader = await activeHeader()
const afterDoubleVoice = await voiceState()
const strip = await page.locator('.channel .voice-strip').count()
check(
  'a double click opens the channel too (the first click is a click)',
  afterDoubleHeader === 'random',
  `header=${JSON.stringify(afterDoubleHeader)}`,
)
check(
  'a double click joins that channel’s voice',
  afterDoubleVoice.inVoice && strip === 1,
  `rooms=${JSON.stringify(afterDoubleVoice.rooms)} voiceStrip=${strip}`,
)

const stripText = strip === 1 ? await page.locator('.channel .voice-strip').innerText() : ''
check('the voice bar names the local user', stripText.includes('You'), JSON.stringify(stripText.replace(/\n/g, ' ')))

await page.screenshot({ path: 'docs/evidence/walk-sc20-voice.png' })

// --- 3. a second double click leaves voice ---------------------------------
await channelRow('random').dblclick()
await page.waitForTimeout(250)

const afterSecond = await voiceState()
const stripAfter = await page.locator('.channel .voice-strip').count()
check(
  'a second double click leaves voice',
  !afterSecond.inVoice && stripAfter === 0,
  `rooms=${JSON.stringify(afterSecond.rooms)} voiceStrip=${stripAfter}`,
)

await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
