// SC23 — the surface ramp reads rail < sidebar < chat.
//
// Asserts the COMPUTED background colour of each surface, not the token values, so
// a selector that overrides the token still fails. Lightness is the WCAG relative
// luminance of the resolved rgb().
//
// Run:  node docs/playwright/sc23-surface-lighting.mjs

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

const luminance = await page.evaluate(() => {
  function relativeLuminance(rgb) {
    const [r, g, b] = rgb.map((value) => {
      const channel = value / 255
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  function sample(selector) {
    const element = document.querySelector(selector)
    if (!element) return null
    const value = getComputedStyle(element).backgroundColor
    const match = value.match(/rgba?\(([^)]+)\)/)
    if (!match) return null
    const parts = match[1].split(',').map((part) => parseFloat(part.trim()))
    return {
      rgb: parts.slice(0, 3),
      css: value,
      luminance: Number(relativeLuminance(parts.slice(0, 3)).toFixed(4)),
    }
  }

  return {
    rail: sample('.shell'),
    sidebar: sample('.sidebar'),
    channel: sample('.channel'),
    thread: sample('.thread'),
  }
})

const { rail, sidebar, channel, thread } = luminance

for (const [name, sample] of Object.entries(luminance)) {
  // A transparent layer would make every "lighter than" comparison vacuous, so the
  // colour has to be real before the ramp means anything.
  const opaque = sample !== null && !/rgba\([^)]*,\s*0\s*\)/.test(sample.css)
  check(`the ${name} surface paints an opaque background`, opaque, sample ? sample.css : 'no element or no background')
}

if (rail && sidebar && channel && thread) {
  check(
    'the sidebar is lighter than the rail',
    sidebar.luminance > rail.luminance,
    `sidebar ${sidebar.luminance} > rail ${rail.luminance}`,
  )
  check(
    'the chat surface is lighter than the sidebar',
    channel.luminance > sidebar.luminance,
    `channel ${channel.luminance} > sidebar ${sidebar.luminance}`,
  )
  check(
    'the thread surface matches the chat surface',
    thread.luminance === channel.luminance,
    `thread ${thread.luminance} vs channel ${channel.luminance}`,
  )
}

await page.screenshot({ path: 'docs/evidence/walk-sc23-surfaces.png' })
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
