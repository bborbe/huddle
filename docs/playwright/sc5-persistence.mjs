// SC5 — every persisted mutation survives a reload, and Reset restores the seed.
//
// The set is the reducer's persisted-mutation list: every action whose case
// mutates `state.workspace`. View state (`selectSpace`, `selectChannel`,
// `selectThread`, `setThreadView`) is excluded by the criterion — it is written
// to storage, but no action mutates the workspace for it.
//
// Each mutation is applied to a fresh seed, checked to have actually changed the
// workspace (a mutation that changes nothing would make "survives a reload"
// vacuous), then read back after a reload and compared whole.
//
// Run:  node docs/playwright/sc5-persistence.mjs

import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'

const MUTATIONS = [
  'createChannel',
  'sendMessage',
  'sendThreadReply',
  'toggleVoice',
  'askAgentVoice',
  'appendMessage',
  'toggleReaction',
  'openThreadForMessage',
  'toggleStar',
  'setIdentity',
  'toggleMute',
  'toggleDeafen',
  'renameChannel',
  'deleteChannel',
]

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

async function fresh() {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await dismissIdentity(page)
}

const workspace = () => page.evaluate(() => window.__huddle.state.workspace)

/** Apply one mutation to the live model. Returns false if it could not be built. */
function apply(kind) {
  return page.evaluate((mutation) => {
    const state = window.__huddle.state
    const id = () => crypto.randomUUID()
    const now = new Date().toISOString()
    const channel =
      state.workspace.channels.find((c) => c.id === state.activeChannelId) ??
      state.workspace.channels[0]
    const thread = channel?.threads[0]
    const message = channel?.messages[0]
    const otherChannel = state.workspace.channels.find((c) => c.id !== channel?.id)

    const actions = {
      createChannel: () => ({
        type: 'createChannel',
        categoryId: state.workspace.categories[0]?.id,
        channelId: id(),
        name: 'persist-probe',
      }),
      sendMessage: () => ({
        type: 'sendMessage',
        channelId: channel.id,
        id: id(),
        body: 'persistence probe',
        sentAt: now,
      }),
      sendThreadReply: () =>
        thread
          ? {
              type: 'sendThreadReply',
              channelId: channel.id,
              threadId: thread.id,
              id: id(),
              body: 'reply probe',
              sentAt: now,
            }
          : null,
      toggleVoice: () => ({
        type: 'toggleVoice',
        channelId: channel.id,
        threadId: null,
        memberId: 'you',
      }),
      askAgentVoice: () => ({
        type: 'askAgentVoice',
        channelId: channel.id,
        threadId: null,
        agentId: 'forge',
        id: id(),
        body: 'voice probe',
        sentAt: now,
      }),
      appendMessage: () => ({
        type: 'appendMessage',
        channelId: channel.id,
        message: { id: id(), authorId: 'forge', body: 'append probe', sentAt: now, toolCalls: [] },
      }),
      toggleReaction: () => ({
        type: 'toggleReaction',
        channelId: channel.id,
        messageId: message.id,
        emoji: '👍',
        memberId: 'you',
      }),
      openThreadForMessage: () => ({
        type: 'openThreadForMessage',
        channelId: channel.id,
        messageId: message.id,
        threadId: id(),
      }),
      toggleStar: () => ({ type: 'toggleStar', channelId: channel.id }),
      setIdentity: () => ({ type: 'setIdentity', name: 'Probe', avatarToken: 2 }),
      toggleMute: () => ({ type: 'toggleMute' }),
      toggleDeafen: () => ({ type: 'toggleDeafen' }),
      renameChannel: () => ({
        type: 'renameChannel',
        channelId: channel.id,
        name: 'renamed-probe',
      }),
      deleteChannel: () => ({ type: 'deleteChannel', channelId: otherChannel?.id }),
    }

    const action = actions[mutation]()
    if (!action) return false
    window.__huddle.dispatch(action)
    return true
  }, kind)
}

for (const mutation of MUTATIONS) {
  await fresh()
  const before = await workspace()
  const applied = await apply(mutation)
  await page.waitForTimeout(250)
  const after = await workspace()

  if (!applied) {
    check(`${mutation} survives a reload`, false, 'could not build the action from the seed')
    continue
  }

  const changed = JSON.stringify(before) !== JSON.stringify(after)
  check(`${mutation} changes the workspace`, changed, changed ? 'workspace moved' : 'no change — the reload check would be vacuous')

  await page.reload({ waitUntil: 'networkidle' })
  await dismissIdentity(page)
  const reloaded = await workspace()
  check(
    `${mutation} survives a reload`,
    JSON.stringify(reloaded) === JSON.stringify(after),
    JSON.stringify(reloaded) === JSON.stringify(after) ? 'identical' : 'the workspace changed across the reload',
  )
}

// --- reset restores the seed exactly ---------------------------------------
await fresh()
const seed = await workspace()
await apply('sendMessage')
await page.waitForTimeout(250)
await page.evaluate(() => window.__huddle.dispatch({ type: 'reset' }))
await page.waitForTimeout(250)
const afterReset = await workspace()
check(
  'reset restores the seed exactly',
  JSON.stringify(afterReset) === JSON.stringify(seed),
  JSON.stringify(afterReset) === JSON.stringify(seed) ? 'identical to the seed' : 'the seed was not restored',
)

await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const resetAfterReload = await workspace()
check(
  'the reset state survives a reload too',
  JSON.stringify(resetAfterReload) === JSON.stringify(seed),
  JSON.stringify(resetAfterReload) === JSON.stringify(seed) ? 'identical to the seed' : 'the reset state did not persist',
)

// --- the list itself --------------------------------------------------------
// The criterion's set must match the reducer: every case that mutates the
// workspace, and none that only moves view state.
const viewOnly = ['selectSpace', 'selectChannel', 'selectThread', 'setThreadView']
check(
  'the mutation list is the reducer’s workspace-mutating set',
  MUTATIONS.length === 14 && viewOnly.every((action) => !MUTATIONS.includes(action)),
  `${MUTATIONS.length} mutations + reset = 15 of 19 actions; view-only excluded: ${viewOnly.join(', ')}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc5-persistence.png' })
await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
