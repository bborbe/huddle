// SC25 — a person is in one voice room at a time, and a thread is a room.
//
// Proves the model invariant, not the pixels: the local member appears in at
// most one room — channel or thread — before any click, after joining a second
// channel, after joining a thread, and after a reload of a blob that already
// held the impossible state.
//
// Run:  node docs/playwright/sc25-single-voice-room.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity, freshLoad } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const KEY = 'huddle:v4'
const LOCAL = 'you'

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await freshLoad(page, BASE)

/** Every voice room the local member occupies, as `channel` or `channel/thread`. */
async function roomsWithLocal() {
  return page.evaluate((local) => {
    const rooms = []
    for (const channel of window.__huddle.state.workspace.channels) {
      if (channel.voiceMemberIds.includes(local)) rooms.push(channel.id)
      for (const thread of channel.threads) {
        if (thread.voiceMemberIds.includes(local)) rooms.push(`${channel.id}/${thread.id}`)
      }
    }
    return rooms
  }, LOCAL)
}

async function channelVoice(channelId) {
  return page.evaluate(
    (id) => window.__huddle.state.workspace.channels.find((c) => c.id === id)?.voiceMemberIds ?? [],
    channelId,
  )
}

const channelRow = (name) =>
  page.locator('[data-category="Product"] .chan-row').filter({ hasText: name })
const threadRow = (name) => page.locator('.sidebar .thread-row').filter({ hasText: name })

// --- 1. the first load is already valid -------------------------------------
const atRest = await roomsWithLocal()
check(
  'the first load puts the local member in at most one voice room',
  atRest.length <= 1,
  `rooms=${JSON.stringify(atRest)}`,
)

// --- 2. joining a channel puts the member there only ------------------------
await channelRow('agent-platform').dblclick()
await page.waitForTimeout(250)
const afterA = await roomsWithLocal()
check(
  'joining agent-platform puts the local member there and nowhere else',
  afterA.length === 1 && afterA[0] === 'agent-platform',
  `rooms=${JSON.stringify(afterA)}`,
)

// --- 3. joining a second channel disconnects from the first -----------------
await channelRow('decision-app').dblclick()
await page.waitForTimeout(250)
const afterB = await roomsWithLocal()
check(
  'joining decision-app leaves the member in decision-app only',
  afterB.length === 1 && afterB[0] === 'decision-app',
  `rooms=${JSON.stringify(afterB)}`,
)
check(
  'the previously joined channel is empty — nobody left behind',
  !(await channelVoice('agent-platform')).includes(LOCAL),
  `agent-platform=${JSON.stringify(await channelVoice('agent-platform'))}`,
)

// --- 4. a thread is a room too: double-click the thread row ----------------
await threadRow('team-scoped decisions').dblclick()
await page.waitForTimeout(300)
const afterThread = await roomsWithLocal()
check(
  'double-clicking a thread row joins voice in that thread',
  afterThread.length === 1 && afterThread[0] === 'decision-app/thr-thresholds',
  `rooms=${JSON.stringify(afterThread)}`,
)
check(
  'joining the thread leaves the channel room',
  !(await channelVoice('decision-app')).includes(LOCAL),
  `decision-app=${JSON.stringify(await channelVoice('decision-app'))}`,
)

// --- 5. the headers carry no voice buttons; the panel does the leaving ------
// The Join/Leave buttons were removed from both headers and the strip's Leave
// button with them. Leaving is the voice panel's hang-up, and this is where it
// is proven — including the negative control: with the hang-up handler removed,
// the "leaves that room" check fails.
const headerVoiceButtons = await page
  .locator('.thread header button, .channel header button')
  .evaluateAll((els) =>
    els
      .map((el) => (el.textContent ?? '').trim())
      .filter((text) => text === 'Join voice' || text === 'Leave voice'),
  )
check(
  'neither header carries a Join/Leave voice button',
  headerVoiceButtons.length === 0,
  JSON.stringify(headerVoiceButtons),
)

const panel = page.locator('.sidebar [data-section="voice-panel"]')
const panelRoom = (await panel.count()) === 1 ? await page.locator('.vp-room-name').innerText() : ''
check(
  'the voice panel appears while in a room and names it',
  (await panel.count()) === 1 && panelRoom.trim() === 'team-scoped decisions',
  `panels=${await panel.count()} room=${JSON.stringify(panelRoom.trim())}`,
)

// Non-vacuous: the room must be occupied first, or "left it" would pass on a
// join that never happened — the failure mode this check exists to catch.
const beforeLeave = await roomsWithLocal()
await page.locator('.voice-panel [aria-label="Disconnect from voice"]').click()
await page.waitForTimeout(300)
const afterLeave = await roomsWithLocal()
check(
  'the panel’s hang-up leaves that room',
  beforeLeave.length === 1 && afterLeave.length === 0,
  `${JSON.stringify(beforeLeave)} → ${JSON.stringify(afterLeave)}`,
)
check(
  'the panel disappears once the room is left',
  (await panel.count()) === 0,
  `panels=${await panel.count()}`,
)

// --- 6. a channel join clears a thread room ---------------------------------
await channelRow('decision-app').dblclick()
await page.waitForTimeout(250)
const afterChannelAgain = await roomsWithLocal()
check(
  'joining the channel leaves every thread room',
  afterChannelAgain.length === 1 && afterChannelAgain[0] === 'decision-app',
  `rooms=${JSON.stringify(afterChannelAgain)}`,
)

// --- 7. the UI agrees: a left channel shows no voice strip -----------------
await channelRow('agent-platform').click()
await page.waitForTimeout(250)
check(
  'agent-platform renders no "In voice" strip after the member left',
  (await page.locator('.channel .voice-strip').count()) === 0,
  `strips=${await page.locator('.channel .voice-strip').count()}`,
)

// --- 8. a stale blob holding two rooms is repaired on load ------------------
await page.evaluate((key) => {
  const state = JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? window.__huddle.state
  const clone = JSON.parse(JSON.stringify(state))
  const a = clone.workspace.channels.find((c) => c.id === 'agent-platform')
  const b = clone.workspace.channels.find((c) => c.id === 'decision-app')
  if (!a.voiceMemberIds.includes('you')) a.voiceMemberIds.push('you')
  if (!b.voiceMemberIds.includes('you')) b.voiceMemberIds.push('you')
  window.localStorage.setItem(key, JSON.stringify(clone))
}, KEY)
await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const repaired = await roomsWithLocal()
// The repair keeps the first room in channel order; `decision-app` is seeded
// before `agent-platform`, so that is the one that survives.
check(
  'a reload repairs a blob that held the member in two rooms',
  repaired.length === 1 && repaired[0] === 'decision-app',
  `rooms=${JSON.stringify(repaired)}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc25-voice.png' })
await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
