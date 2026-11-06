// Shared walk setup. Every walk starts from a clean browser, and since SC15 the
// first run shows the identity dialog — so a walk that is not testing that dialog
// dismisses it before doing anything else.

export const IDENTITY_SKIP = '.dialog button:has-text("Skip")'

/**
 * Load the app with empty storage and get past the first-run identity dialog.
 * Returns nothing; the page is ready for the walk.
 */
export async function freshLoad(page, base) {
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await dismissIdentity(page)
}

/** Dismiss the identity dialog if it is showing. */
export async function dismissIdentity(page) {
  const skip = page.locator(IDENTITY_SKIP)
  if ((await skip.count()) > 0) {
    await skip.first().click()
    await page.waitForTimeout(150)
  }
  // Park the pointer in the corner: the Skip button sits over the message pane, and
  // leaving the pointer there makes a message's hover toolbar render before the
  // walk has hovered anything.
  await page.mouse.move(4, 4)
  await page.waitForTimeout(100)
}
