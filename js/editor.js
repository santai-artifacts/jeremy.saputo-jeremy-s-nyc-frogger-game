/* =============================================================================
 * GOTHAM HOP — STREET EDITOR  (editor.js)
 * -----------------------------------------------------------------------------
 * The community-facing authoring tool. Lets anyone compose a street from the
 * core's whitelisted lane types and sprites, validates it live against the same
 * schema the engine uses, and exports a JSON file ready to drop into /streets/.
 *
 * This is the open layer: it can only ever produce streets that conform to the
 * governed contract, so creativity stays high while the core stays safe.
 * ===========================================================================*/

(function () {
  const G = window.GOTHAM;
  const $ = (s, r = document) => r.querySelector(s);

  const vehicleSprites = Object.entries(G.CATALOG)
    .filter(([, v]) => v.kind === 'vehicle').map(([k]) => k);
  const platformSprites = Object.entries(G.CATALOG)
    .filter(([, v]) => v.kind === 'platform').map(([k]) => k);

  let modal, rowsEl, onPlay;
  let model = null; // { id, name, author, description, rows: [...] }

  G.openEditor = function openEditor(library, playStreet) {
    onPlay = playStreet;
    if (!modal) build();
    if (!model) loadBlank();
    modal.classList.add('show');
    render();
  };

  function loadBlank() {
    model = {
      id: 'my-street',
      name: 'My Street',
      author: '',
      description: '',
      rows: [
        { type: 'goal', slots: [1, 4, 6, 8, 11] },
        { type: 'safe' },
        { type: 'road', dir: 1, speed: 2, sprite: 'taxi', gap: 3 },
        { type: 'road', dir: -1, speed: 2.4, sprite: 'car', gap: 3 },
        { type: 'start' },
      ],
    };
  }

  function build() {
    modal = document.createElement('div');
    modal.id = 'editorModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card">
        <header class="modal-head">
          <h2>🛠️ Street Editor</h2>
          <button class="icon-btn" id="edClose">✕</button>
        </header>
        <div class="ed-grid">
          <section class="ed-left">
            <div class="ed-meta">
              <label>Title <input id="edName" type="text"></label>
              <label>id <input id="edId" type="text"></label>
              <label>Author <input id="edAuthor" type="text"></label>
              <label class="wide">Description <input id="edDesc" type="text"></label>
            </div>
            <div class="ed-rows-head">
              <span>Lanes — top is the goal, bottom is the start</span>
              <button class="btn small" id="edAddRow">+ Add lane</button>
            </div>
            <div id="edRows" class="ed-rows"></div>
          </section>
          <aside class="ed-right">
            <div class="ed-validate" id="edValidate"></div>
            <div class="ed-actions">
              <button class="btn primary" id="edPlay">▶ Play this street</button>
              <button class="btn" id="edCopy">⧉ Copy JSON</button>
              <button class="btn" id="edDownload">⭳ Download .json</button>
            </div>
            <p class="hint">To publish: download the file, drop it in
              <code>/streets/</code>, and add its name to
              <code>streets/manifest.json</code> in a pull request.</p>
            <pre id="edJson" class="ed-json"></pre>
          </aside>
        </div>
      </div>`;
    document.body.appendChild(modal);
    rowsEl = $('#edRows', modal);

    $('#edClose', modal).onclick = () => modal.classList.remove('show');
    $('#edAddRow', modal).onclick = () => {
      // insert a road lane above the start row
      model.rows.splice(model.rows.length - 1, 0,
        { type: 'road', dir: 1, speed: 2, sprite: 'taxi', gap: 3 });
      render();
    };
    ['edName:name', 'edId:id', 'edAuthor:author', 'edDesc:description'].forEach((pair) => {
      const [id, key] = pair.split(':');
      $('#' + id, modal).oninput = (e) => { model[key] = e.target.value; sync(); };
    });
    $('#edPlay', modal).onclick = () => {
      const { ok, errors } = G.validateStreet(model);
      if (!ok) return flashInvalid(errors);
      modal.classList.remove('show');
      onPlay(JSON.parse(JSON.stringify(model)));
    };
    $('#edCopy', modal).onclick = () => {
      navigator.clipboard.writeText(json()).then(() => toast('Copied JSON to clipboard'));
    };
    $('#edDownload', modal).onclick = () => download();
  }

  function render() {
    $('#edName', modal).value = model.name;
    $('#edId', modal).value = model.id;
    $('#edAuthor', modal).value = model.author;
    $('#edDesc', modal).value = model.description;
    rowsEl.innerHTML = '';
    model.rows.forEach((row, i) => rowsEl.appendChild(rowControl(row, i)));
    sync();
  }

  function rowControl(row, i) {
    const wrap = document.createElement('div');
    wrap.className = 'ed-row type-' + row.type;
    const locked = i === 0 || i === model.rows.length - 1; // goal / start fixed ends

    const typeOptions = Object.keys(G.LANE_TYPES)
      .map((t) => `<option value="${t}" ${t === row.type ? 'selected' : ''}>${t}</option>`)
      .join('');

    let extra = '';
    if (row.type === 'road' || row.type === 'water') {
      const sprites = row.type === 'road' ? vehicleSprites : platformSprites;
      extra = `
        <label>dir
          <select data-k="dir">
            <option value="1" ${row.dir === 1 ? 'selected' : ''}>→</option>
            <option value="-1" ${row.dir === -1 ? 'selected' : ''}>←</option>
          </select></label>
        <label>sprite
          <select data-k="sprite">
            ${sprites.map((s) => `<option value="${s}" ${s === row.sprite ? 'selected' : ''}>${G.CATALOG[s].glyph} ${s}</option>`).join('')}
          </select></label>
        <label>speed <input type="number" data-k="speed" min="0.2" max="6" step="0.2" value="${row.speed}"></label>
        <label>gap <input type="number" data-k="gap" min="1" max="12" step="1" value="${row.gap}"></label>`;
    } else if (row.type === 'goal') {
      extra = `<label class="wide">slots (cols 0–${G.RULES.COLS - 1}, comma-sep)
        <input type="text" data-k="slots" value="${(row.slots || []).join(',')}"></label>`;
    }

    wrap.innerHTML = `
      <span class="ed-row-num">${i}</span>
      <label>type
        <select data-k="type" ${locked ? 'disabled' : ''}>${typeOptions}</select></label>
      ${extra}
      <button class="icon-btn del" ${locked ? 'disabled' : ''} title="remove">🗑</button>`;

    wrap.querySelectorAll('[data-k]').forEach((ctrl) => {
      ctrl.oninput = () => applyField(i, ctrl.dataset.k, ctrl.value);
    });
    const del = wrap.querySelector('.del');
    if (!locked) del.onclick = () => { model.rows.splice(i, 1); render(); };
    return wrap;
  }

  function applyField(i, key, value) {
    const row = model.rows[i];
    if (key === 'type') {
      // re-seed defaults for the new type
      if (value === 'road') Object.assign(row, { type: 'road', dir: 1, speed: 2, sprite: 'taxi', gap: 3 });
      else if (value === 'water') Object.assign(row, { type: 'water', dir: 1, speed: 1.4, sprite: 'ferry', gap: 3 });
      else model.rows[i] = { type: value };
      return render();
    }
    if (key === 'dir' || key === 'speed' || key === 'gap') row[key] = Number(value);
    else if (key === 'sprite') row.sprite = value;
    else if (key === 'slots') {
      row.slots = value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    }
    sync();
  }

  function json() { return JSON.stringify(model, null, 2); }

  function sync() {
    $('#edJson', modal).textContent = json();
    const { ok, errors } = G.validateStreet(model);
    const v = $('#edValidate', modal);
    if (ok) {
      v.className = 'ed-validate ok';
      v.innerHTML = '✓ Valid — ready to play or publish.';
    } else {
      v.className = 'ed-validate bad';
      v.innerHTML = '✗ ' + errors.map((e) => `<div>${e}</div>`).join('');
    }
  }

  function flashInvalid(errors) {
    const v = $('#edValidate', modal);
    v.className = 'ed-validate bad shake';
    v.innerHTML = '✗ ' + errors.map((e) => `<div>${e}</div>`).join('');
    setTimeout(() => v.classList.remove('shake'), 500);
  }

  function download() {
    const { ok, errors } = G.validateStreet(model);
    if (!ok) return flashInvalid(errors);
    const blob = new Blob([json()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (model.id || 'street') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 1600);
  }
})();
