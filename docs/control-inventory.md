# Control inventory

Every control the app renders, one row per element of the union across rendering
states. Generated from `docs/evidence/control-union.json` — regenerate with
`node docs/playwright/enumerate.mjs && node docs/playwright/inventory.mjs` after any
UI change, never by hand.

**46 rows** across **8 states**. States: at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed.

| # | Control | Selector | States | Effect |
|---|---|---|---|---|
| 1 | 👍 2 | `.channel [aria-label="👍 2"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 2 | 😊 1 | `.channel [aria-label="😊 1"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 3 | 🚀 1 | `.channel [aria-label="🚀 1"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 4 | React with 👍 | `.channel [aria-label="React with 👍"]` | message-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 5 | React with 😊 | `.channel [aria-label="React with 😊"]` | message-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 6 | React with 🚀 | `.channel [aria-label="React with 🚀"]` | message-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 7 | Reply in thread | `.channel [aria-label="Reply in thread"]` | message-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 8 | Send | `.channel [aria-label="Send"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 9 | Unstar channel | `.channel [aria-label="Unstar channel"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 10 | 3 replies | `.channel button:has-text("3 replies")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 11 | Ask agent to join | `.channel button:has-text("Ask agent to join")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 12 | Bashkubectl get deploy decision-app -o jsonpath={.spec.templ | `.channel button:has-text("Bashkubectl get deploy d")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 13 | Editci/build.yml — replace sparse filter with full checkout  | `.channel button:has-text("Editci/build.yml — repla")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 14 | Join voice | `.channel button:has-text("Join voice")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 15 | ReadDockerfile — rule bundle copy stepsuccess▸ | `.channel button:has-text("ReadDockerfile — rule bu")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 16 | Replay reply | `.channel button:has-text("Replay reply")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 17 | (unnamed) | `.channel textarea.composer-field` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | receives focus and accepts typed text (value reflected in the DOM) |
| 18 | Cancel | `.dialog button:has-text("Cancel")` | settings-dialog-open | model delta or DOM insertion — asserted by the walk, never by eye |
| 19 | Delete channel | `.dialog button:has-text("Delete channel")` | settings-dialog-open | model delta or DOM insertion — asserted by the walk, never by eye |
| 20 | Save | `.dialog button:has-text("Save")` | settings-dialog-open | model delta or DOM insertion — asserted by the walk, never by eye |
| 21 | NameCancelSaveDelete channel | `.dialog form:has-text("NameCancelSaveDelete cha")` | settings-dialog-open | submitting (Enter in its input) creates or saves, and closes the popup |
| 22 | Reset demo | `.sidebar [aria-label="Reset demo"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 23 | Close thread | `.thread [aria-label="Close thread"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 24 | Collapse thread | `.thread [aria-label="Collapse thread"]` | thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 25 | Expand thread | `.thread [aria-label="Expand thread"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 26 | Send reply | `.thread [aria-label="Send reply"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 27 | ‹ decision-app / | `.thread button:has-text("‹ decision-app /")` | thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 28 | Ask agent | `.thread button:has-text("Ask agent")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 29 | Join voice | `.thread button:has-text("Join voice")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 30 | Leave | `.thread button:has-text("Leave")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | model delta or DOM insertion — asserted by the walk, never by eye |
| 31 | (unnamed) | `.thread textarea.composer-field` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | receives focus and accepts typed text (value reflected in the DOM) |
| 32 | Switch to Decision App | `[aria-label="Switch to Decision App"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 33 | Switch to Huddle | `[aria-label="Switch to Huddle"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 34 | GEgeneral | `[data-category="General"] button:has-text("GEgeneral")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 35 | RArandom | `[data-category="General"] button:has-text("RArandom")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 36 | Channel settings | `[data-category="Product"] [aria-label="Channel settings"]` | channel-gear-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 37 | Create a channel | `[data-category="Product"] [aria-label="Create a channel"]` | category-hovered, create-popup-open, channel-gear-hovered | model delta or DOM insertion — asserted by the walk, never by eye |
| 38 | APagent-platform | `[data-category="Product"] button:has-text("APagent-platform")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 39 | Cancel | `[data-category="Product"] button:has-text("Cancel")` | create-popup-open | model delta or DOM insertion — asserted by the walk, never by eye |
| 40 | Create | `[data-category="Product"] button:has-text("Create")` | create-popup-open | model delta or DOM insertion — asserted by the walk, never by eye |
| 41 | DAdecision-app | `[data-category="Product"] button:has-text("DAdecision-app")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 42 | team-scoped decisions | `[data-category="Product"] button:has-text("team-scoped decisions")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 43 | Create a channel in ProductCancelCreate | `[data-category="Product"] form:has-text("Create a channel in Prod")` | create-popup-open | submitting (Enter in its input) creates or saves, and closes the popup |
| 44 | DAdecision-app | `[data-section="starred"] button:has-text("DAdecision-app")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | model delta or DOM insertion — asserted by the walk, never by eye |
| 45 | (unnamed) | `#channel-settings-name` | settings-dialog-open | receives focus and accepts typed text (value reflected in the DOM) |
| 46 | (unnamed) | `#new-channel-cat-product` | create-popup-open | receives focus and accepts typed text (value reflected in the DOM) |
