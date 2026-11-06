# Control inventory

Every control the app renders, one row per element of the union across rendering
states. Generated from `docs/evidence/control-union.json` — regenerate with
`node docs/playwright/enumerate.mjs && node docs/playwright/inventory.mjs` after any
UI change, never by hand.

**50 rows** across **11 states**. States: at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel.

| # | Control | Selector | States | Effect |
|---|---|---|---|---|
| 1 | 👍 2 | `.channel [aria-label="👍 2"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 2 | 😊 1 | `.channel [aria-label="😊 1"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 3 | 🚀 1 | `.channel [aria-label="🚀 1"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 4 | React with 👍 | `.channel [aria-label="React with 👍"]` | message-hovered | changes the model: workspace |
| 5 | React with 😊 | `.channel [aria-label="React with 😊"]` | message-hovered | changes the model: workspace |
| 6 | React with 🚀 | `.channel [aria-label="React with 🚀"]` | message-hovered | changes the model: workspace |
| 7 | Reply in thread | `.channel [aria-label="Reply in thread"]` | message-hovered | changes the model: activeThreadId "thr-thresholds" → "277f7b5a-0fb1-4467-8b5c-2c304e935802"; workspace |
| 8 | Send | `.channel [aria-label="Send"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed, voice-panel | changes the model: workspace |
| 9 | Star | `.channel [aria-label="Star"]` | at-rest-decision-app, category-hovered-decision-app, voice-panel | changes the model: workspace |
| 10 | Unstar channel | `.channel [aria-label="Unstar channel"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | changes the model: workspace |
| 11 | 3 replies | `.channel button:has-text("3 replies")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 235→241 elements |
| 12 | Ask agent to join | `.channel button:has-text("Ask agent to join")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed, voice-panel | changes the model: workspace |
| 13 | Bashkubectl get deploy decision-app -o jsonpath={.spec.templ | `.channel button:has-text("Bashkubectl get deploy d")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 235→239 elements |
| 14 | Editci/build.yml — replace sparse filter with full checkout  | `.channel button:has-text("Editci/build.yml — repla")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 235→243 elements |
| 15 | ReadDockerfile — rule bundle copy stepsuccess▸ | `.channel button:has-text("ReadDockerfile — rule bu")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed | inserts or removes DOM: 235→243 elements |
| 16 | Replay reply | `.channel button:has-text("Replay reply")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed, voice-panel | inserts or removes DOM: 235→246 elements |
| 17 | (unnamed) | `.channel textarea.composer-field` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-closed, voice-panel | receives focus and accepts typed text (value reflected in the DOM) |
| 18 | Cancel | `.dialog button:has-text("Cancel")` | settings-dialog-open | inserts or removes DOM: 246→241 elements |
| 19 | Delete channel | `.dialog button:has-text("Delete channel")` | settings-dialog-open | inserts or removes DOM: 246→242 elements |
| 20 | Save | `.dialog button:has-text("Save")` | settings-dialog-open | inserts or removes DOM: 246→241 elements |
| 21 | NameCancelSaveDelete channel | `.dialog form:has-text("NameCancelSaveDelete cha")` | settings-dialog-open | submitting inserts/removes DOM: 246→235 elements |
| 22 | Reset demo | `.sidebar [aria-label="Reset demo"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: workspace |
| 23 | Close thread | `.thread [aria-label="Close thread"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 24 | Collapse thread | `.thread [aria-label="Collapse thread"]` | thread-full | changes the model: threadView "full" → "split" |
| 25 | Expand thread | `.thread [aria-label="Expand thread"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered | changes the model: threadView "split" → "full" |
| 26 | Send reply | `.thread [aria-label="Send reply"]` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: workspace |
| 27 | ‹ decision-app / | `.thread button:has-text("‹ decision-app /")` | thread-full | changes the model: threadView "full" → "split" |
| 28 | Ask agent | `.thread button:has-text("Ask agent")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | changes the model: workspace |
| 29 | (unnamed) | `.thread textarea.composer-field` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full | receives focus and accepts typed text (value reflected in the DOM) |
| 30 | Switch to Decision App | `[aria-label="Switch to Decision App"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeSpaceId "huddle" → "decisions"; activeChannelId "decision-app" → "rule-reviews"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 31 | Switch to Huddle | `[aria-label="Switch to Huddle"]` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeSpaceId "decisions" → "huddle"; activeChannelId "rule-reviews" → "decision-app"; activeThreadId null → "thr-thresholds"; threadView "closed" → "split" |
| 32 | GEgeneral | `[data-category="General"] button:has-text("GEgeneral")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeChannelId "decision-app" → "general"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 33 | RArandom | `[data-category="General"] button:has-text("RArandom")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeChannelId "decision-app" → "random"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 34 | Channel settings | `[data-category="Product"] [aria-label="Channel settings"]` | channel-gear-hovered, voice-panel | inserts or removes DOM: 237→246 elements |
| 35 | Create a channel | `[data-category="Product"] [aria-label="Create a channel"]` | category-hovered, create-popup-open, channel-gear-hovered, voice-panel | inserts or removes DOM: 236→242 elements |
| 36 | APagent-platform | `[data-category="Product"] button:has-text("APagent-platform")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeChannelId "decision-app" → "agent-platform"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 37 | Cancel | `[data-category="Product"] button:has-text("Cancel")` | create-popup-open | inserts or removes DOM: 242→236 elements |
| 38 | Create | `[data-category="Product"] button:has-text("Create")` | create-popup-open | changes the model: activeChannelId "decision-app" → "75ac1074-74ae-4748-85fa-03512d4bd3ee"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed"; workspace |
| 39 | DAdecision-app | `[data-category="Product"] button:has-text("DAdecision-app")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 40 | team-scoped decisions | `[data-category="Product"] button:has-text("team-scoped decisions")` | at-rest, category-hovered, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | inserts or removes DOM: 235→236 elements |
| 41 | Create a channel in ProductCancelCreate | `[data-category="Product"] form:has-text("Create a channel in Prod")` | create-popup-open | submitting changes the model: activeChannelId "decision-app" → "fa52fb1f-281c-4d8f-b328-6693fb3e7d49"; activeThreadId "thr-thresholds" → null; threadView "split" → "closed"; workspace |
| 42 | Create a channel | `[data-category="Reviews"] [aria-label="Create a channel"]` | category-hovered-decision-app | inserts or removes DOM: 73→79 elements |
| 43 | RRrule-reviews | `[data-category="Reviews"] button:has-text("RRrule-reviews")` | at-rest-decision-app, category-hovered-decision-app | inserts or removes DOM: 72→74 elements |
| 44 | TMtenant-migration | `[data-category="Reviews"] button:has-text("TMtenant-migration")` | at-rest-decision-app, category-hovered-decision-app | changes the model: activeChannelId "rule-reviews" → "tenant-migration" |
| 45 | DAdecision-app | `[data-section="starred"] button:has-text("DAdecision-app")` | at-rest, category-hovered, at-rest-decision-app, category-hovered-decision-app, create-popup-open, channel-gear-hovered, settings-dialog-open, message-hovered, thread-full, thread-closed, voice-panel | changes the model: activeThreadId "thr-thresholds" → null; threadView "split" → "closed" |
| 46 | Deafen | `[data-section="voice-panel"] [aria-label="Deafen"]` | voice-panel | NOT MEASURED — run docs/playwright/sc3-control-walk.mjs |
| 47 | Disconnect from voice | `[data-section="voice-panel"] [aria-label="Disconnect from voice"]` | voice-panel | NOT MEASURED — run docs/playwright/sc3-control-walk.mjs |
| 48 | Mute myself | `[data-section="voice-panel"] [aria-label="Mute myself"]` | voice-panel | NOT MEASURED — run docs/playwright/sc3-control-walk.mjs |
| 49 | (unnamed) | `#channel-settings-name` | settings-dialog-open | receives focus and accepts typed text (value reflected in the DOM) |
| 50 | (unnamed) | `#new-channel-cat-product` | create-popup-open | receives focus and accepts typed text (value reflected in the DOM) |
