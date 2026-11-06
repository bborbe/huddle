# Seed coverage

Every feature the app supports must be visible on a **fresh browser with no stored
state**, without the operator doing anything. A feature with no seed evidence fails
the criterion — it is indistinguishable from a feature that does not work.

Keep this table current as features land. `docs/playwright/sc18-seed-coverage.mjs`
asserts every row on first load.

| Feature | Seed evidence | Where |
|---|---|---|
| Starred section renders | `decision-app` is starred, so the section is present on load | `src/lib/fixtures.ts` — `channels[0].starred: true` |
| All three quick reactions | One message carries 👍 😊 🚀 with distinct reactors | `src/lib/fixtures.ts` — `m-da-1.reactions` |
| Thread with replies (`N replies` line) | `thr-thresholds` on `m-da-3` carries 3 replies | `src/lib/fixtures.ts` — `decision-app.threads[0]` |
| Inline code and a fenced code block | One message carries both, plus literal markdown that must stay literal | `src/lib/fixtures.ts` — `m-ap-4` in `agent-platform` |
| Channels in every category | `Product` (2), `General` (2), `Reviews` (2 across two spaces) | `src/lib/fixtures.ts` — `categories` |
| Tool call cards | A message carries `Bash` and `Read` calls, one expanded and one collapsed | `src/lib/fixtures.ts` — `m-da-2.toolCalls` |
| Voice presence | Two channels show members in voice; one thread too | `decision-app.voiceMemberIds`, `general.voiceMemberIds`, `thr-thresholds.voiceMemberIds` |
| Two spaces | `Huddle` and `Decision App`, each with its own categories | `src/lib/fixtures.ts` — `spaces` |

## Changing the seed

Any change here needs the storage key bumped in `src/platform/storage.ts`
(currently `huddle:v4`). A browser holding the previous key keeps the old seed and
never sees the new demo data — that is exactly how the deployed page once rendered
blank after a shape change.
