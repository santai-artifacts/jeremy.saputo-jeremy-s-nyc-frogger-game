# 🗽 Gotham Hop

A New York City take on the arcade classic *Frogger*. Hop across avenues of
yellow cabs, buses, and Citi Bikes, then raft your way over the Hudson to the
stoops on the far side.

This repo is deliberately split into **two layers** so the game can be both
*tightly controlled at the core* and *wide open at the edges*.

```
┌─────────────────────────────────────────────────────────────┐
│  CORE RULES LAYER  (governed — limited editors)              │
│  js/config.js   global rules + the sprite/lane whitelist     │
│  js/schema.js   the contract every street must satisfy       │
│  js/engine.js   movement, collision, scoring, win condition  │
└─────────────────────────────────────────────────────────────┘
                 ▲ validated against ▲
┌─────────────────────────────────────────────────────────────┐
│  STREET LAYER  (open — anyone can contribute)                │
│  streets/*.json        one file = one playable block         │
│  streets/manifest.json the playlist of streets in a run      │
└─────────────────────────────────────────────────────────────┘
```

**Why two layers?** The rules of the game (how fast is fatal, how scoring works,
what a "lane" even is) should be consistent and trustworthy, so they live in a
small core owned by a few maintainers. The *content* — the actual streets — is
where you want a whole community inventing wild blocks. Because every street is
validated against the core schema before it loads, an open street can never
break or cheat the game. See **[docs/GOVERNANCE.md](docs/GOVERNANCE.md)**.

## Play

It's a single static page — no build step.

- Open `index.html` (the platform serves it automatically), **or**
- serve the folder locally so `fetch()` can read the street files:
  ```bash
  python3 -m http.server 8000   # then visit http://localhost:8000
  ```

Move with **WASD / arrow keys**, **swipe** on mobile, or the on-screen pad.
Reach the 🗽 stoops without getting flattened or falling in the river.

## Make a street

You don't need to touch any code.

1. Click **🛠️ Street Editor** in the game.
2. Add and arrange lanes (the editor only offers core-approved pieces, and
   validates live as you go).
3. **▶ Play this street** to test it instantly, or **⭳ Download** the `.json`.
4. To publish it for everyone: drop the file in `streets/`, add its filename to
   `streets/manifest.json`, and open a pull request.

Full field reference: **[docs/STREET-SCHEMA.md](docs/STREET-SCHEMA.md)**.

## Project layout

| Path | Layer | Who edits it |
|------|-------|--------------|
| `js/config.js`, `js/schema.js`, `js/engine.js` | Core rules | Core maintainers (see `CODEOWNERS`) |
| `js/main.js`, `js/editor.js` | App shell / tooling | Core maintainers |
| `streets/*.json` | Street content | Anyone, via PR |
| `docs/` | Reference | Anyone |

## Roadmap

- Persistence for high scores and saved streets (needs a backend — currently
  everything is in-memory for the session).
- A hosted street gallery + upvoting so the manifest can be community-curated.
- More sprite families in the catalog (subway cars, pretzel carts, snow plows).

Built as a starting point — fork the streets, respect the core. 🐸
