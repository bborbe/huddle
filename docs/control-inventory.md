# Control inventory

Every control the app renders, one row per element of the union across rendering
states. Generated from `docs/evidence/control-union.json` — regenerate with
`node docs/playwright/enumerate.mjs && node docs/playwright/inventory.mjs` after any
UI change, never by hand.

**50 rows** across **10 states**. States: at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed.

| # | Control | Selector | States | Effect |
|---|---|---|---|---|
| 1 | 👍 2 | `.channel [aria-label="👍 2"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 2 | 😊 1 | `.channel [aria-label="😊 1"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 3 | 🚀 1 | `.channel [aria-label="🚀 1"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 4 | React with 👍 | `.channel [aria-label="React with 👍"]` | message-hovered | changes the model: workspace |
| 5 | React with 😊 | `.channel [aria-label="React with 😊"]` | message-hovered | changes the model: workspace |
| 6 | React with 🚀 | `.channel [aria-label="React with 🚀"]` | message-hovered | changes the model: workspace |
| 7 | Reply in thread | `.channel [aria-label="Reply in thread"]` | message-hovered | changes the model: activeThreadId "thr-thresholds" → "31bfe54a-f0dd-4391-9343-8a6135ee22f2"; workspace |
| 8 | Send | `.channel [aria-label="Send"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 9 | Star | `.channel [aria-label="Star"]` | at-rest-decision-app, category-hovered-decision-app | changes the model: workspace |
| 10 | Unstar channel | `.channel [aria-label="Unstar channel"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 11 | 3 replies | `.channel button:has-text("3 replies")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 238→244 elements |
| 12 | Ask agent to join | `.channel button:has-text("Ask agent to join")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 13 | Bashkubectl get deploy decision-app -o jsonpath={.spec.templ | `.channel button:has-text("Bashkubectl get deploy d")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 238→242 elements |
| 14 | Editci/build.yml — replace sparse filter with full checkout  | `.channel button:has-text("Editci/build.yml — repla")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 238→246 elements |
| 15 | Join voice | `.channel button:has-text("Join voice")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 16 | ReadDockerfile — rule bundle copy stepsuccess▸ | `.channel button:has-text("ReadDockerfile — rule bu")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 238→246 elements |
| 17 | Replay reply | `.channel button:has-text("Replay reply")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 238→249 elements |
| 18 | (unnamed) | `.channel textarea.composer-field` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | receives focus and accepts typed text (value reflected in the DOM) |
| 19 | Cancel | `.dialog button:has-text("Cancel")` | settings-dialog-open | inserts or removes DOM: 249→244 elements |
| 20 | Delete channel | `.dialog button:has-text("Delete channel")` | settings-dialog-open | inserts or removes DOM: 249→245 elements |
| 21 | Save | `.dialog button:has-text("Save")` | settings-dialog-open | inserts or removes DOM: 249→244 elements |
| 22 | NameCancelSaveDelete channel | `.dialog form:has-text("NameCancelSaveDelete cha")` | settings-dialog-open | submitting inserts/removes DOM: 249→238 elements |
| 23 | Reset demo | `.sidebar [aria-label="Reset demo"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: workspace |
| 24 | Close thread | `.thread [aria-label="Close thread"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 25 | Collapse thread | `.thread [aria-label="Collapse thread"]` | thread-full | changes the model: threadView "full" → "split" |
| 26 | Expand thread | `.thread [aria-label="Expand thread"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered | changes the model: threadView "split" → "full" |
| 27 | Send reply | `.thread [aria-label="Send reply"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: workspace |
| 28 | ‹ decision-app / | `.thread button:has-text("‹ decision-app /")` | thread-full | changes the model: threadView "full" → "split" |
| 29 | Ask agent | `.thread button:has-text("Ask agent")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: workspace |
| 30 | Join voice | `.thread button:has-text("Join voice")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: workspace |
| 31 | Leave | `.thread button:has-text("Leave")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: workspace |
| 32 | (unnamed) | `.thread textarea.composer-field` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | receives focus and accepts typed text (value reflected in the DOM) |
| 33 | Switch to Decision App | `[aria-label="Switch to Decision App"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeSpaceId "huddle" → "decisions"; activeChannelId "decision-app" → "rule-reviews"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 34 | Switch to Huddle | `[aria-label="Switch to Huddle"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeSpaceId "decisions" → "huddle"; activeChannelId "rule-reviews" → "decision-app"; activeThreadId null → "thr-thresholds"; threadView "closed" → "split" |
| 35 | GEgeneral | `[data-category="General"] button:has-text("GEgeneral")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeChannelId "decision-app" → "general"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 36 | RArandom | `[data-category="General"] button:has-text("RArandom")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeChannelId "decision-app" → "random"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 37 | Channel settings | `[data-category="Product"] [aria-label="Channel settings"]` | channel-gear-hovered | inserts or removes DOM: 240→249 elements |
| 38 | Create a channel | `[data-category="Product"] [aria-label="Create a channel"]` | category-hovered, create-popup-open, channel-gear-hovered | inserts or removes DOM: 239→245 elements |
| 39 | APagent-platform | `[data-category="Product"] button:has-text("APagent-platform")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeChannelId "decision-app" → "agent-platform"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 40 | Cancel | `[data-category="Product"] button:has-text("Cancel")` | create-popup-open | inserts or removes DOM: 245→239 elements |
| 41 | Create | `[data-category="Product"] button:has-text("Create")` | create-popup-open | changes the model: activeChannelId "decision-app" → "bffbcc34-2b08-4b8f-a317-72bd334c3ebd"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed"; workspace |
| 42 | DAdecision-app | `[data-category="Product"] button:has-text("DAdecision-app")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 43 | team-scoped decisions | `[data-category="Product"] button:has-text("team-scoped decisions")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | inserts or removes DOM: 238→239 elements |
| 44 | Create a channel in ProductCancelCreate | `[data-category="Product"] form:has-text("Create a channel in Prod")` | create-popup-open | submitting changes the model: activeChannelId "decision-app" → "e1365592-4496-46c4-82ec-81100a0e2564"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed"; workspace |
| 45 | Create a channel | `[data-category="Reviews"] [aria-label="Create a channel"]` | category-hovered-decision-app | inserts or removes DOM: 74→80 elements |
| 46 | RRrule-reviews | `[data-category="Reviews"] button:has-text("RRrule-reviews")` | at-rest-decision-app, category-hovered-decision-app | inserts or removes DOM: 73→75 elements |
| 47 | TMtenant-migration | `[data-category="Reviews"] button:has-text("TMtenant-migration")` | at-rest-decision-app, category-hovered-decision-app | changes the model: activeChannelId "rule-reviews" → "tenant-migration" |
| 48 | DAdecision-app | `[data-section="starred"] button:has-text("DAdecision-app")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed | changes the model: activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 49 | (unnamed) | `#channel-settings-name` | settings-dialog-open | receives focus and accepts typed text (value reflected in the DOM) |
| 50 | (unnamed) | `#new-channel-cat-product` | create-popup-open | receives focus and accepts typed text (value reflected in the DOM) |
