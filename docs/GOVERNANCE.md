# Governance — the two-layer model

Gotham Hop is split so that the **rules** are controlled by a few people while
the **content** is open to many. This document explains the boundary and how
changes flow through each layer.

## The two layers

### 1. Core rules layer — *controlled*

**Files:** `js/config.js`, `js/schema.js`, `js/engine.js`
(and the app shell `js/main.js`, `js/editor.js`).

This layer defines what the game *is*:

- **`config.js`** — the global rules (`RULES`) and the whitelist of every sprite
  (`CATALOG`) and lane type (`LANE_TYPES`) a street may use. Editing a number
  here — lives, timer, scoring, the difficulty ramp — changes the game for
  every street ever made.
- **`schema.js`** — `validateStreet()`, the single contract that every street
  must pass. This is the gate that keeps the open layer safe.
- **`engine.js`** — the data-driven engine: movement, hazard motion, collision,
  drowning, scoring, and the win condition. It knows nothing about any specific
  street.

**Who edits it:** a limited set of maintainers listed in
[`CODEOWNERS`](../CODEOWNERS). Changes require their review because they affect
everyone and can subtly rebalance every existing street.

**Bar for change:** a core change should have a clear reason (balance, a new
sprite family, a bug fix) and must keep existing valid streets valid — or ship
with a documented migration.

### 2. Street layer — *open*

**Files:** `streets/*.json` and `streets/manifest.json`.

Each JSON file is one playable block, composed entirely from core-approved
pieces. The manifest is the ordered playlist used by the "Full City Run".

**Who edits it:** anyone. Submit a street via pull request, or just play it
locally with the in-game editor without submitting anything.

**Why it's safe to keep open:** the engine runs *every* street through
`validateStreet()` before loading it. A street that references an unknown
sprite, uses an illegal speed, or is missing its goal/start rows is **rejected**
with a reason and simply doesn't load — it cannot crash or cheat the game.

## How a change flows

```
Want to add a NEW STREET?            Want to change a RULE / add a sprite?
        │                                      │
 use the in-game editor               edit js/config.js (+ engine if needed)
        │                                      │
 download the .json                   the change touches a CODEOWNERS path
        │                                      │
 add it to streets/ + manifest        requires core-maintainer review
        │                                      │
 open a PR  ──►  CI runs the          discuss balance / migration impact
 validator on every street                     │
        │                                      │
 a reviewer plays it, merges          merge once approved
```

## Adding or changing a sprite (core)

1. Add an entry to `GOTHAM.CATALOG` in `config.js` with a fixed `kind`
   (`vehicle` for roads, `platform` for water), `len`, `glyph`, and `color`.
2. That's it — the editor and validator pick it up automatically, so street
   authors can use it immediately.

Keeping the catalog in the core (rather than letting streets define arbitrary
sprites) is what guarantees balance and a consistent look across community
content.

## Suggested branch protection

To enforce this model in practice on the hosting platform:

- Require PR review from a `CODEOWNERS` entry for `js/**`.
- Allow lighter review for `streets/**` (content), but require the validator
  check to pass.
- Run the validation harness in `docs/STREET-SCHEMA.md` as a CI step so no
  invalid street can ever be merged.
