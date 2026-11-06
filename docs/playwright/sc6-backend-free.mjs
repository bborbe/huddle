// SC6 — the app stays backend-free on the production build.
//
// Proves: the preview build exposes the model with at least 3 channels and at
// least 15 channel messages, the active channel's messages are rendered, and the
// network log holds zero fetch / XHR / WebSocket entries across page load plus an
// interaction sweep. The listener is proven live first: the same capture against
// the Vite dev server must record at least one WebSocket (its HMR client), so a
// zero on the preview build means zero rather than a dead listener.
//
// Run:  node docs/playwright/sc6-backend-free.mjs

import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '/Users/bborbe/.npm/_npx/13ab0715f9f30c2e/node_modules/playwright/index.mjs'
import { dismissIdentity } from './lib/fresh.mjs'

const BASE = process.env.HUDDLE_URL ?? 'http://localhost:5173/'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DEV_PORT = 5199

const results = []
function check(name, pass, delta) {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  — ${delta}`)
}

/** Record every request a page makes that could reach a backend. */
function capture(page) {
  const seen = { fetch: [], xhr: [], websocket: [] }
  page.on('request', (request) => {
    const kind = request.resourceType()
    if (kind === 'fetch') seen.fetch.push(request.url())
    if (kind === 'xhr') seen.xhr.push(request.url())
  })
  page.on('websocket', (socket) => seen.websocket.push(socket.url()))
  return seen
}

const browser = await chromium.launch({ headless: true })

// --- 1. the production build: model, content, and zero network --------------
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const seen = capture(page)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => window.localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await dismissIdentity(page)

const model = await page.evaluate(() => {
  const workspace = window.__huddle?.state?.workspace
  if (!workspace) return null
  const channels = workspace.channels
  return {
    channels: channels.length,
    messages: channels.reduce((total, channel) => total + channel.messages.length, 0),
    activeChannelId: window.__huddle.state.activeChannelId,
  }
})
check('the production build exposes window.__huddle', model !== null, model ? 'model readable' : 'no model on window')
check(
  'the seed holds at least 3 channels',
  (model?.channels ?? 0) >= 3,
  `channels=${model?.channels}`,
)
check(
  'the seed holds at least 15 channel messages (thread replies excluded)',
  (model?.messages ?? 0) >= 15,
  `messages=${model?.messages}`,
)

const rendered = await page.locator('.channel article.msg').count()
check(
  'the active channel renders its messages in its pane',
  rendered >= 1,
  `rendered=${rendered} activeChannel=${model?.activeChannelId}`,
)

// --- 2. the interaction sweep: everything an action can trigger -------------
await page.locator('.channel .composer-field').fill('network probe')
await page.locator('.channel .send-btn').click()
await page.waitForTimeout(200)

await page.locator('.channel article.msg').first().hover()
await page.waitForTimeout(150)
await page.locator('.channel [aria-label="React with 👍"]').first().click()
await page.waitForTimeout(150)
await page.locator('.channel [aria-label="Reply in thread"]').first().click()
await page.waitForTimeout(200)
await page.locator('.thread button[aria-label="Expand thread"]').click()
await page.waitForTimeout(200)
await page.locator('.thread .breadcrumb').click()
await page.waitForTimeout(200)
await page.locator('.thread button[aria-label="Close thread"]').click()
await page.waitForTimeout(200)

await page.locator('.channel [aria-label="Star"], .channel [aria-label="Unstar channel"]').first().click()
await page.waitForTimeout(150)
await page.locator('.channel button', { hasText: 'Ask agent to join' }).first().click().catch(() => {})
await page.waitForTimeout(150)

await page.locator('[data-category] .cat-row').first().hover()
await page.waitForTimeout(150)
await page.locator('button[aria-label="Create a channel"]').first().click()
await page.waitForTimeout(150)
await page.locator('#new-channel-cat-product').fill('net-probe')
await page.locator('[data-category] form').first().press('Enter')
await page.waitForTimeout(300)

await page.locator('[data-category="Product"] .chan-wrap').filter({ hasText: 'net-probe' }).hover()
await page.waitForTimeout(150)
await page.locator('button[aria-label="Channel settings"]').first().click()
await page.waitForTimeout(200)
await page.locator('#channel-settings-name').fill('net-probe-2')
await page.locator('[role="dialog"] button[type="submit"]').click()
await page.waitForTimeout(250)

await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
await page.waitForTimeout(250)
await page.locator('nav.rail button[aria-label="Switch to Huddle"]').click()
await page.waitForTimeout(250)

await page.locator('[data-category="Product"] .chan-row').filter({ hasText: 'agent-platform' }).dblclick()
await page.waitForTimeout(250)

const total = seen.fetch.length + seen.xhr.length + seen.websocket.length
check(
  'the production build makes no fetch, XHR or WebSocket call',
  total === 0,
  `fetch=${seen.fetch.length} xhr=${seen.xhr.length} websocket=${seen.websocket.length}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc6-backend-free.png' })
await page.evaluate(() => window.localStorage.clear())
await page.close()

// --- 3. the listener is live: the dev server must produce a WebSocket -------
const dev = spawn(
  process.execPath,
  [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(DEV_PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' },
)

let devExited = false
dev.on('exit', () => {
  devExited = true
})

async function waitForDev(timeoutMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (devExited) throw new Error('vite dev exited before it was ready')
    try {
      const response = await fetch(`http://localhost:${DEV_PORT}/`)
      if (response.ok) return true
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 250))
  }
  return false
}

try {
  const up = await waitForDev()
  check('the dev server boots for the positive control', up, `port=${DEV_PORT}`)
  if (up) {
    const devPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const devSeen = capture(devPage)
    await devPage.goto(`http://localhost:${DEV_PORT}/`, { waitUntil: 'networkidle' })
    await devPage.waitForTimeout(1500)
    check(
      'the same capture records the dev server’s HMR WebSocket — the listener is live',
      devSeen.websocket.length >= 1,
      `websocket=${devSeen.websocket.length} ${JSON.stringify(devSeen.websocket.slice(0, 1))}`,
    )
    await devPage.close()
  }
} finally {
  dev.kill()
}

await browser.close()

const failed = results.filter((result) => !result.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
