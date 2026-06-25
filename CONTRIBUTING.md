# Contributing

There are two very different ways to contribute, matching the two layers of the
project. Please read [docs/GOVERNANCE.md](docs/GOVERNANCE.md) first.

## 🟢 Contributing a street (open to everyone)

This is the easy, encouraged path.

1. Open the game and click **🛠️ Street Editor**.
2. Build your block. The editor only lets you use approved pieces and validates
   as you go.
3. Click **⭳ Download .json** and save it into `streets/`.
4. Add the filename to the `playlist` array in `streets/manifest.json`.
5. Validate locally (see [docs/STREET-SCHEMA.md](docs/STREET-SCHEMA.md#validate-before-you-submit)).
6. Open a pull request. A reviewer will play it and merge.

**Street PR checklist**
- [ ] `id` is unique and kebab-case.
- [ ] File passes the headless validator.
- [ ] It's actually beatable (you cleared it yourself).
- [ ] Added to `manifest.json` if it should be in the main run.

Street PRs only touch `streets/**` and get a light, fast review.

## 🔒 Contributing to the core (maintainers)

Changes to `js/config.js`, `js/schema.js`, or `js/engine.js` affect every
street and every player. These require review from a code owner (see
[`CODEOWNERS`](CODEOWNERS)).

Before opening a core PR:
- Explain the gameplay/balance reason in the description.
- Confirm **all existing streets still validate** (run the validator over every
  file in `streets/`).
- If you change scoring, timing, or the difficulty ramp, note the expected
  impact on existing streets.
- Adding a sprite? Just extend `CATALOG` — the editor and validator pick it up
  automatically; no engine change needed.

## Style

- Vanilla JS, no build step, no dependencies. Keep it that way unless a change
  genuinely earns its weight.
- Comment the *why*, not the *what*.
- Match the existing structure and naming.
