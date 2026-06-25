/* =============================================================================
 * GOTHAM HOP — STREET SCHEMA & VALIDATOR  (schema.js)
 * -----------------------------------------------------------------------------
 * Part of the GOVERNED CORE. This is the contract between the controlled engine
 * and the open community street layer.
 *
 * Anyone can author a street (/streets/*.json), but every layout is validated
 * against this schema before it is allowed to load. Invalid streets are
 * rejected with a clear reason instead of crashing the game — this is what lets
 * the central layer stay safe while the street layer stays open.
 * ===========================================================================*/

window.GOTHAM = window.GOTHAM || {};

GOTHAM.validateStreet = function validateStreet(street) {
  const errors = [];
  const RULES = GOTHAM.RULES;
  const CATALOG = GOTHAM.CATALOG;
  const fail = (msg) => errors.push(msg);

  if (!street || typeof street !== 'object') {
    return { ok: false, errors: ['Street must be a JSON object.'] };
  }

  // --- Metadata -------------------------------------------------------------
  if (!street.id || !/^[a-z0-9-]+$/.test(street.id)) {
    fail('`id` is required and must be kebab-case (a–z, 0–9, dashes).');
  }
  if (!street.name || typeof street.name !== 'string') {
    fail('`name` (display title) is required.');
  }

  // --- Rows -----------------------------------------------------------------
  if (!Array.isArray(street.rows) || street.rows.length < 3) {
    fail('`rows` must be an array with at least 3 rows (goal, hazards, start).');
    return { ok: false, errors };
  }
  if (street.rows.length > 16) {
    fail('`rows` may contain at most 16 rows to keep the board readable.');
  }

  const first = street.rows[0];
  const last = street.rows[street.rows.length - 1];
  if (!first || first.type !== 'goal') fail('The first row must be of type "goal".');
  if (!last || last.type !== 'start') fail('The last row must be of type "start".');

  street.rows.forEach((row, i) => {
    const where = `rows[${i}] (${row && row.type})`;
    if (!row || typeof row !== 'object') { fail(`${where}: not an object.`); return; }
    if (!GOTHAM.LANE_TYPES[row.type]) {
      fail(`${where}: unknown lane type "${row.type}". Allowed: ${Object.keys(GOTHAM.LANE_TYPES).join(', ')}.`);
      return;
    }

    if (row.type === 'goal') {
      if (!Array.isArray(row.slots) || row.slots.length === 0) {
        fail(`${where}: goal row needs a non-empty "slots" array of column indices.`);
      } else {
        row.slots.forEach((c) => {
          if (!Number.isInteger(c) || c < 0 || c >= RULES.COLS) {
            fail(`${where}: slot column ${c} is out of range 0..${RULES.COLS - 1}.`);
          }
        });
      }
    }

    if (row.type === 'road' || row.type === 'water') {
      const wantKind = row.type === 'road' ? 'vehicle' : 'platform';
      if (![1, -1].includes(row.dir)) fail(`${where}: "dir" must be 1 (right) or -1 (left).`);
      if (typeof row.speed !== 'number' || row.speed <= 0 || row.speed > 6) {
        fail(`${where}: "speed" must be a number in tiles/sec, 0 < speed ≤ 6.`);
      }
      const sprite = CATALOG[row.sprite];
      if (!sprite) {
        fail(`${where}: unknown sprite "${row.sprite}". Allowed: ${Object.keys(CATALOG).join(', ')}.`);
      } else if (sprite.kind !== wantKind) {
        fail(`${where}: sprite "${row.sprite}" is a ${sprite.kind}; a ${row.type} lane needs a ${wantKind}.`);
      }
      if (typeof row.gap !== 'number' || row.gap < 1 || row.gap > RULES.COLS) {
        fail(`${where}: "gap" (empty tiles between sprites) must be between 1 and ${RULES.COLS}.`);
      }
    }
  });

  return { ok: errors.length === 0, errors };
};

/* Produce a friendly, themed empty street so the game never hard-fails even if
 * every community file is missing. Used as the built-in fallback. */
GOTHAM.FALLBACK_STREET = {
  id: 'first-ave',
  name: 'First Avenue (built-in)',
  author: 'core',
  description: 'A simple starter street that ships with the engine.',
  rows: [
    { type: 'goal',  slots: [1, 4, 6, 8, 11] },
    { type: 'water', dir: -1, speed: 1.2, sprite: 'ferry', gap: 3 },
    { type: 'water', dir: 1,  speed: 1.6, sprite: 'barge', gap: 2 },
    { type: 'safe' },
    { type: 'road',  dir: 1,  speed: 2.4, sprite: 'taxi', gap: 3 },
    { type: 'road',  dir: -1, speed: 1.8, sprite: 'bus',  gap: 4 },
    { type: 'road',  dir: 1,  speed: 3.0, sprite: 'car',  gap: 3 },
    { type: 'start' },
  ],
};
