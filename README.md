# Huddle

A shared workspace where people and AI agents work in the same channels — a frontend-only prototype, built to be looked at and judged before any runtime exists behind it.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

That is the whole setup. No backend, no database, no environment variables, no accounts.

## Checks

```bash
make precommit
```

Runs, in order and failing fast: `install` (`npm ci`) → `lint` (type-aware oxlint over `src`, warnings are errors) → `typecheck` (`tsc --noEmit`) → `build` (`vite build`) → `test`.

`make test` boots `vite preview` on the built output and runs every walk in [`docs/playwright/`](docs/playwright/), each against the real page, then shuts the server down. It exits non-zero if any walk fails, so it needs `make build` first when run on its own.

Each target is also runnable alone: `make lint`, `make typecheck`, `make build`, `make test`.

## What is real

Everything you do in the page:

- **Name yourself on first open** — a dialog asks for a name only; the avatar colour is derived from it (the same helper the channel tiles use) and a shuffle cycles it. Start stores the identity, so your messages and voice lines read as that name; Skip leaves everything as it is and the dialog returns next load.
- Switch channels and send a message
- **Star a channel** — the star in the channel header pins it to a `Starred` section above the categories, alphabetically. It stays in its own category too: the section is a second view, not a move. The star is outline when off, filled when on, and the state survives a reload.
- **Create a channel the way Slack does it** — hover a category row (`Product`, `General`) and a `+` appears on it with a "Create a channel" tooltip; click it, type a name, press Enter, and the channel is created inside that category. The button is not in the page at rest — it only exists while its category row is hovered.
- Open a thread, reply in it, expand it to full width, close it
- **React and reply from a message** — hovering a channel message reveals a small toolbar on it: three quick reactions (`👍` `😊` `🚀`) and a reply action that opens that message's thread. Clicking a reaction adds it, clicking it again removes it, and both survive a reload. A message that has replies shows an `N replies` line beneath it that opens the same thread.
- Join and leave voice in a channel or a thread
- Ask an agent into voice and watch its reply appear
- Replay a simulated agent turn — typing indicator, token-by-token stream, tool call moving from running to completed
- Reset the demo back to the seed state

Your changes are written to `localStorage` and survive a reload.

## What is fake

Be clear about this — nothing here is connected to anything.

- **No backend.** There is no server, no API, no WebSocket. The app is static files served by Vite.
- **No real agents.** The two agents (Forge, Scout) are seed data. Their replies are scripted strings.
- **No real people.** Bob, Tobias and Lena are demo identities. Nothing claims they are online.
- **No multiplayer.** Two browser profiles are two independent worlds. Nothing is shared between them, and this prototype proves nothing about live viewing by a second person.
- **No audio.** "In voice" is a list of names. There is no microphone, no media connection, no call.
- **No server-side persistence.** Browser storage only, and only on this machine.
- **No mobile app.** The layout is desktop-only.

## Layout

```
src/
  lib/        shared, platform-neutral — types, fixtures, reducer, formatting
  platform/   the seam: storage, ids, timestamps (web implementation)
  components/ web-only view layer
  styles/     tokens.css (from the design export) + app.css
```

`src/lib` never imports from `src/components` or touches the DOM, so a native shell could reuse the domain model and reducer unchanged.

## Design source

The visual reference is the design handoff export (`chat-ui-handoff.zip`): six HTML screens, `tokens.css`, 2× screenshots and the Geist fonts. Its inline styles were translated into `app.css` keyed on the export's own class concepts, with every value drawn from `tokens.css` — the tokens stay the single source of truth.

## Evidence

Screenshots and screen recordings for each success criterion live in [`docs/evidence/`](docs/evidence/).
