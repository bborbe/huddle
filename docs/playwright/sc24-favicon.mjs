// SC24 — the app has a tab icon, and it is the rail's H tile.
//
// Proves: /favicon.svg returns 200 as an SVG; /apple-touch-icon.png returns 200 as a
// PNG; index.html carries the icon link and the theme-color; and the SVG survives
// 16px — the letter is still distinguishable rather than a blob.
//
// Run:  node docs/playwright/sc24-favicon.mjs

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

// --- the assets are served ------------------------------------------------
const svg = await page.request.get(`${BASE}favicon.svg`)
check('favicon.svg is served', svg.status() === 200, `status=${svg.status()}`)
const svgBody = svg.status() === 200 ? await svg.text() : ''
check('favicon.svg is an SVG', svgBody.includes('<svg') && svgBody.includes('</svg>'), `${svgBody.length} bytes`)

const png = await page.request.get(`${BASE}apple-touch-icon.png`)
check('apple-touch-icon.png is served', png.status() === 200, `status=${png.status()}`)
const pngType = png.headers()['content-type'] ?? ''
check('apple-touch-icon.png is a PNG', pngType.includes('png'), `content-type=${pngType}`)

// --- index.html wires them ------------------------------------------------
const iconLink = await page.locator('link[rel="icon"]').getAttribute('href')
check('index.html carries the icon link', iconLink === '/favicon.svg', `href=${JSON.stringify(iconLink)}`)

const touchLink = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
check('index.html carries the apple-touch-icon link', touchLink === '/apple-touch-icon.png', `href=${JSON.stringify(touchLink)}`)

const themeColour = await page.locator('meta[name="theme-color"]').getAttribute('content')
check('theme-color is the app background token', themeColour?.toUpperCase() === '#0A0A0B', `content=${JSON.stringify(themeColour)}`)

// --- the mark survives 16px ----------------------------------------------
// Drawn to a 16×16 canvas and counted: a letter that turned to mush would leave
// either almost no light pixels or a solid block.
const pixels = await page.evaluate(async (src) => {
  const image = new Image()
  image.src = src
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, 16, 16)
  const { data } = context.getImageData(0, 0, 16, 16)
  let light = 0
  let opaque = 0
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
    if (a > 0) opaque += 1
    // the letter is #A1A1AA, the tile is #18181B
    if (a > 0 && r > 100 && g > 100 && b > 100) light += 1
  }
  return { light, opaque, total: 256 }
}, `${BASE}favicon.svg`)

check(
  'the mark fills the 16px tile',
  pixels.opaque >= 200,
  `opaque=${pixels.opaque}/${pixels.total}`,
)

check(
  'the letter is still legible at 16px — present, but not a solid block',
  pixels.light >= 8 && pixels.light <= 120,
  `letter pixels=${pixels.light} of ${pixels.total}`,
)

await page.screenshot({ path: 'docs/evidence/walk-sc24-favicon.png' })
await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length === 0 ? 0 : 1)
