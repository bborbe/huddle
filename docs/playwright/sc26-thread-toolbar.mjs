// SC26 — the hover reaction toolbar works in the thread pane too.
//
// A reply is a message like any other, so the three quick reactions appear on
// the thread's parent message and on every reply, and dispatch `toggleReaction`
// against the message that lives inside the thread. The reply action is
// deliberately absent inside a thread — a reply to a reply is a nested thread,
// out of scope — and the channel pane keeps its reply button.
//
// Run:  node docs/playwright/sc26-thread-toolbar.mjs

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

await freshLoad(page, BASE)

// The seed opens `thr-thresholds` in split view: one parent message plus replies.
const threadMessages = page.locator('.thread article.msg')
const replyIndex = 1

check(
  'the thread pane renders its parent message and replies',
  (await threadMessages.count()) >= 2,
  `messages=${await threadMessages.count()}`,
)

// --- 1. no toolbar until something is hovered -------------------------------
check(
  'no thread toolbar is rendered at rest',
  (await page.locator('.thread .msg-toolbar').count()) === 0,
  `toolbars=${await page.locator('.thread .msg-toolbar').count()}`,
)

// --- 2. hovering a reply reveals the toolbar --------------------------------
await threadMessages.nth(replyIndex).hover()
await page.waitForTimeout(200)
const threadToolbars = await page.locator('.thread .msg-toolbar').count()
check(
  'hovering a reply reveals its toolbar',
  threadToolbars === 1,
  `toolbars=${threadToolbars}`,
)

const reactionButtons = await page
  .locator('.thread .msg-toolbar [aria-label^="React with"]')
  .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))
check(
  'the thread toolbar carries the three quick reactions',
  reactionButtons.length === 3,
  JSON.stringify(reactionButtons),
)

const replyButtonsInThread = await page
  .locator('.thread .msg-toolbar [aria-label="Reply in thread"]')
  .count()
check(
  'the thread toolbar has no reply action — a reply to a reply is out of scope',
  replyButtonsInThread === 0,
  `replyButtons=${replyButtonsInThread}`,
)

// --- 3. the reaction lands on that reply, and only that reply ---------------
await page.locator('.thread .msg-toolbar [aria-label="React with 👍"]').first().click()
await page.waitForTimeout(250)

const model = await page.evaluate(() => {
  const state = window.__huddle.state
  const channel = state.workspace.channels.find((c) => c.id === state.activeChannelId)
  const thread = channel.threads.find((t) => t.id === state.activeThreadId)
  return {
    parent: thread.parentMessageId,
    replies: thread.replies.map((reply) => ({
      id: reply.id,
      likes: reply.reactions?.['👍'] ?? [],
    })),
    channelLikes: channel.messages.flatMap((message) =>
      (message.reactions?.['👍'] ?? []).map(() => message.id),
    ),
  }
})

const likedReplies = model.replies.filter((reply) => reply.likes.includes('you'))
check(
  'clicking 👍 puts the local member on that one reply',
  likedReplies.length === 1 && model.replies[replyIndex - 1].likes.includes('you'),
  `liked=${JSON.stringify(likedReplies.map((reply) => reply.id))}`,
)
check(
  'the channel messages are untouched',
  !model.channelLikes.includes(model.parent),
  `channel likes=${JSON.stringify(model.channelLikes)}`,
)

// --- 4. the parent message gets a toolbar too -------------------------------
await page.mouse.move(4, 4)
await page.waitForTimeout(150)
await threadMessages.nth(0).hover()
await page.waitForTimeout(200)
check(
  'hovering the thread parent reveals a toolbar as well',
  (await page.locator('.thread .msg-toolbar').count()) === 1,
  `toolbars=${await page.locator('.thread .msg-toolbar').count()}`,
)

// --- 5. it survives a reload ------------------------------------------------
await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)
const afterReload = await page.evaluate(() => {
  const state = window.__huddle.state
  const channel = state.workspace.channels.find((c) => c.id === state.activeChannelId)
  const thread = channel.threads.find((t) => t.id === state.activeThreadId)
  return thread.replies.map((reply) => (reply.reactions?.['👍'] ?? []).includes('you'))
})
check(
  'the reply reaction survives a reload',
  afterReload.filter(Boolean).length === 1,
  `liked replies after reload=${afterReload.filter(Boolean).length}`,
)

// --- 6. the channel pane is unchanged ---------------------------------------
const channelMessage = page.locator('.channel article.msg').first()
await channelMessage.hover()
await page.waitForTimeout(200)
const channelReplyButtons = await page
  .locator('.channel .msg-toolbar [aria-label="Reply in thread"]')
  .count()
check(
  'the channel pane keeps its reply action',
  channelReplyButtons === 1,
  `replyButtons=${channelReplyButtons}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc26-thread-toolbar.png' })
await page.evaluate(() => window.localStorage.clear())
await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
