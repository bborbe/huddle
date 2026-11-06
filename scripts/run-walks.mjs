// Runs every Playwright walk under docs/playwright against the BUILT app.
//
// Boots `vite preview` on a fixed port, points each walk at it via HUDDLE_URL,
// and shuts the server down. Non-zero exit if any walk fails or the server never
// comes up. Run `npm run build` first — this does not build.
//
// Run:  node scripts/run-walks.mjs

import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const walkDir = join(root, 'docs', 'playwright')
const PORT = Number(process.env.WALK_PORT ?? 4173)
const URL = `http://localhost:${PORT}/`

if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.error('dist/index.html is missing — run `make build` (or `npm run build`) first.')
  process.exit(1)
}

const walks = readdirSync(walkDir)
  .filter((file) => file.endsWith('.mjs'))
  .sort()

if (walks.length === 0) {
  console.error(`No walks found in ${walkDir}`)
  process.exit(1)
}

const server = spawn(
  process.execPath,
  [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: 'ignore' },
)

let serverExited = false
server.on('exit', () => {
  serverExited = true
})

async function waitForServer(timeoutMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (serverExited) throw new Error('preview server exited before it was ready')
    try {
      const response = await fetch(URL)
      if (response.ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`preview server did not answer on ${URL} within ${timeoutMs}ms`)
}

function runWalk(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(walkDir, file)], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, HUDDLE_URL: URL },
    })
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

let failures = 0
try {
  await waitForServer()
  console.log(`Running ${walks.length} walks against ${URL}\n`)

  for (const walk of walks) {
    console.log(`── ${walk}`)
    const code = await runWalk(walk)
    if (code !== 0) {
      failures += 1
      console.log(`✗ ${walk} failed (exit ${code})\n`)
    } else {
      console.log(`✓ ${walk}\n`)
    }
  }
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error))
  failures += 1
} finally {
  server.kill('SIGTERM')
}

console.log(`${walks.length - failures}/${walks.length} walks passed`)
process.exit(failures === 0 ? 0 : 1)
