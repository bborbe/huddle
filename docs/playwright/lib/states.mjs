// The rendering states SC2 enumerates over. Each entry puts the app into that
// state; the enumeration and the walk both use this, so the population and the
// proof cannot drift apart.

export const STATES = {
  'at-rest': async () => {},

  'category-hovered': async (page) => {
    await page.locator('[data-category] .cat-row').first().hover()
    await page.waitForTimeout(150)
  },

  // The sidebar renders only the active space's categories, so the second space is
  // a separate population — enumerating one space silently omits the other.
  'at-rest-decision-app': async (page) => {
    await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
    await page.waitForTimeout(250)
  },

  'category-hovered-decision-app': async (page) => {
    await page.locator('nav.rail button[aria-label="Switch to Decision App"]').click()
    await page.waitForTimeout(250)
    await page.locator('[data-category] .cat-row').first().hover()
    await page.waitForTimeout(150)
  },

  'create-popup-open': async (page) => {
    await page.locator('[data-category] .cat-row').first().hover()
    await page.waitForTimeout(150)
    await page.locator('button[aria-label="Create a channel"]').first().click()
    await page.waitForTimeout(150)
  },

  'channel-gear-hovered': async (page) => {
    await page.locator('[data-category] .chan-wrap').first().hover()
    await page.waitForTimeout(150)
  },

  'settings-dialog-open': async (page) => {
    await page.locator('[data-category] .chan-wrap').first().hover()
    await page.waitForTimeout(150)
    await page.locator('button[aria-label="Channel settings"]').first().click()
    await page.waitForTimeout(200)
  },

  'message-hovered': async (page) => {
    await page.locator('.channel article.msg').first().hover()
    await page.waitForTimeout(150)
  },

  'thread-full': async (page) => {
    await page.locator('.thread button[aria-label="Expand thread"]').click()
    await page.waitForTimeout(200)
  },

  'thread-closed': async (page) => {
    await page.locator('.thread button[aria-label="Close thread"]').click()
    await page.waitForTimeout(200)
  },

  // The voice panel only exists while a room is joined, so its controls are
  // outside every other state's population.
  'voice-panel': async (page) => {
    await page.locator('[data-category] .chan-row').first().dblclick()
    await page.waitForTimeout(300)
  },
}

export const STATE_NAMES = Object.keys(STATES)

/** Build a stable, unique-ish selector for an element. */
export function selectorFor(element) {
  if (element.id) return `#${element.id}`

  // Scope by the nearest container that makes the control unique — a category, the
  // starred section, a panel, or a dialog. Without this, the two composers collapse
  // into one row.
  const scope = element.closest(
    '[data-category], [data-section], .channel, .thread, .sidebar, .dialog',
  )
  let scopeAttr = ''
  if (scope) {
    if (scope.hasAttribute('data-category')) {
      scopeAttr = `[data-category="${scope.getAttribute('data-category')}"] `
    } else if (scope.hasAttribute('data-section')) {
      scopeAttr = `[data-section="${scope.getAttribute('data-section')}"] `
    } else if (scope.classList.contains('channel')) {
      scopeAttr = '.channel '
    } else if (scope.classList.contains('thread')) {
      scopeAttr = '.thread '
    } else if (scope.classList.contains('sidebar')) {
      scopeAttr = '.sidebar '
    } else if (scope.classList.contains('dialog')) {
      scopeAttr = '.dialog '
    }
  }

  const aria = element.getAttribute('aria-label')
  if (aria) return `${scopeAttr}[aria-label="${aria}"]`

  const text = (element.textContent ?? '').trim().slice(0, 24)
  if (text) return `${scopeAttr}${element.tagName.toLowerCase()}:has-text("${text}")`

  const className = typeof element.className === 'string' ? element.className.trim() : ''
  const cls = className ? `.${className.split(/\s+/).join('.')}` : ''
  return `${scopeAttr}${element.tagName.toLowerCase()}${cls}`
}
