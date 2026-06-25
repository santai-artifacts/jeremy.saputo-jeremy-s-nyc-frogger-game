# Street schema reference

A street is a single JSON file in `streets/`. It is validated by
`GOTHAM.validateStreet()` (in `js/schema.js`) before it loads. This page is the
human-readable version of that contract.

## Top-level shape

```json
{
  "id": "canal-street",
  "name": "Canal Street",
  "author": "your-handle",
  "description": "One-line pitch shown on the loading banner.",
  "avatar": "🐸",
  "rows": [ ... ]
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `id` | ✅ | kebab-case, `^[a-z0-9-]+$`. Must be unique. |
| `name` | ✅ | Display title. |
| `author` | – | Your handle/credit. |
| `description` | – | Short flavor text shown when the street loads. |
| `avatar` | – | Emoji for the hopper on this street. Defaults to 🐸. |
| `rows` | ✅ | 3–16 lanes, **top to bottom**. First must be `goal`, last must be `start`. |

> Row order is **top of the screen first**. The player starts on the last row
> (`start`) and works *up* to the first row (`goal`).

## Lane types

Every entry in `rows` has a `type`. The board is always **13 columns** wide
(`RULES.COLS`), indexed `0`–`12`.

### `start`
The sidewalk where each life begins. Always safe.
```json
{ "type": "start" }
```

### `safe`
A median / sidewalk you can stand on indefinitely.
```json
{ "type": "safe" }
```

### `road`
Traffic crosses horizontally. **Touching any vehicle is fatal.**
```json
{ "type": "road", "dir": 1, "speed": 2.4, "sprite": "taxi", "gap": 3 }
```
| Field | Rules |
|-------|-------|
| `dir` | `1` = moves right, `-1` = moves left. |
| `speed` | tiles per second, `0 < speed ≤ 6`. (Scaled up as the run progresses.) |
| `sprite` | a **vehicle** from the catalog (see below). |
| `gap` | empty tiles between vehicles, `1`–`13`. Smaller = denser traffic. |

### `water`
The Hudson. **You must be riding a platform** or you fall in. While on a
platform you drift with it — ride too far off the edge and you're swept away.
```json
{ "type": "water", "dir": -1, "speed": 1.2, "sprite": "ferry", "gap": 3 }
```
Same fields as `road`, but `sprite` must be a **platform**.

### `goal`
The destination stoops at the top. Land in an empty slot to bank it; fill every
slot to clear the street.
```json
{ "type": "goal", "slots": [1, 4, 6, 8, 11] }
```
| Field | Rules |
|-------|-------|
| `slots` | non-empty array of column indices (`0`–`12`) marking landing spots. Everything between slots is a solid wall — landing there is fatal. |

## Sprite catalog

Streets may only use sprites defined in `GOTHAM.CATALOG` (`js/config.js`). This
keeps length, look, and balance consistent. As of this version:

**Vehicles (for `road` lanes)**

| key | glyph | length |
|-----|-------|--------|
| `taxi` | 🚕 | 1 |
| `car` | 🚗 | 1 |
| `bike` | 🚲 | 1 |
| `cart` | 🛺 | 1 |
| `bus` | 🚌 | 2 |
| `truck` | 🚚 | 2 |

**Platforms (for `water` lanes)**

| key | glyph | length |
|-----|-------|--------|
| `kayak` | 🛶 | 1 |
| `barge` | 🛥️ | 2 |
| `raft` | 🪵 | 2 |
| `ferry` | ⛴️ | 3 |

Need a new sprite? That's a **core** change — see
[GOVERNANCE.md](GOVERNANCE.md).

## Design tips

- Alternate `dir` between adjacent lanes so the player has to time both ways.
- Give a `water` section at least one wide platform (`ferry`/`barge`) so it's
  survivable; tiny `gap` values with `kayak` are brutal.
- Put a `safe` lane between the road section and the water section to give
  players a breather (and a checkpoint of nerve).
- Keep early streets gentle — the engine speeds everything up the deeper a run
  goes (`RULES.SPEED_RAMP_PER_STREET`).

## Validate before you submit

Headless check that mirrors what the game does:

```bash
node -e '
const fs=require("fs"),vm=require("vm");
const s={}; s.window=s; s.console=console; vm.createContext(s);
for(const f of ["js/config.js","js/schema.js"]) vm.runInContext(fs.readFileSync(f,"utf8"),s,{filename:f});
const street=JSON.parse(fs.readFileSync(process.argv[1]));
const r=s.window.GOTHAM.validateStreet(street);
console.log(r.ok?"✓ valid":"✗ invalid\n"+r.errors.join("\n"));
process.exit(r.ok?0:1);
' streets/your-street.json
```
