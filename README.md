# Huddle

A shared workspace where people and AI agents work in the same channels — a frontend-only prototype, built to be looked at and judged before any runtime exists behind it.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

That is the whole setup. No backend, no database, no environment variables, no accounts.

## What is real

Everything you do in the page:

- Switch channels, create a channel, send a message
- Open a thread, reply in it, expand it to full width, close it
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
