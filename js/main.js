/* =============================================================================
 * GOTHAM HOP — BOOTSTRAP & UI  (main.js)
 * ===========================================================================*/

(function () {
  const G = window.GOTHAM;
  const $ = (sel) => document.querySelector(sel);

  const TITLE = 'Frogger in NYC'; // display name shown on the idle banner

  // Tiny drawn frog for the Lives readout (no emoji anywhere in the game).
  const FROG_ICON =
    '<svg class="life-frog" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">' +
    '<ellipse cx="16" cy="18" rx="8" ry="8.5" fill="#43b14b"/>' +
    '<ellipse cx="16" cy="20" rx="4.5" ry="5.5" fill="#62c96a"/>' +
    '<circle cx="11" cy="9" r="4" fill="#43b14b"/><circle cx="21" cy="9" r="4" fill="#43b14b"/>' +
    '<circle cx="11" cy="8.5" r="2" fill="#fff"/><circle cx="21" cy="8.5" r="2" fill="#fff"/>' +
    '<circle cx="11.4" cy="8.5" r="1" fill="#10240f"/><circle cx="20.6" cy="8.5" r="1" fill="#10240f"/>' +
    '</svg>';

  const canvas = $('#stage');
  const game = new G.Game(canvas, { onState: renderHUD, onMessage: showBanner });

  const library = new Map();

  // ---- Load streets -------------------------------------------------------
  async function loadLibrary() {
    let files = [];
    try {
      const manifest = await fetch('streets/manifest.json').then((r) => r.json());
      files = manifest.playlist || [];
    } catch (e) {
      console.warn('No manifest reachable, using built-in street.', e);
    }

    const report = [];
    for (const file of files) {
      try {
        const data = await fetch('streets/' + file).then((r) => r.json());
        const { ok, errors } = G.validateStreet(data);
        if (ok) {
          library.set(data.id, data);
          report.push({ file, ok: true });
        } else {
          report.push({ file, ok: false, errors });
          console.warn(`Rejected ${file}:`, errors);
        }
      } catch (e) {
        report.push({ file, ok: false, errors: [String(e)] });
      }
    }

    if (library.size === 0) library.set(G.FALLBACK_STREET.id, G.FALLBACK_STREET);
    populatePicker();
    renderLoadReport(report);
    return report;
  }

  // ---- Street picker ------------------------------------------------------
  function populatePicker() {
    const sel = $('#streetPicker');
    sel.innerHTML = '';
    const all = document.createElement('option');
    all.value = '__all__';
    all.textContent = 'Full City Run (all streets)';
    sel.appendChild(all);
    for (const s of library.values()) {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.name + (s.author ? ` — ${s.author}` : '');
      sel.appendChild(o);
    }
  }

  function renderLoadReport(report) {
    const el = $('#loadReport');
    const bad = report.filter((r) => !r.ok);
    el.innerHTML = bad.length
      ? `<span class="ok">✓ ${report.length - bad.length} streets loaded.</span> <span class="bad">✗ ${bad.length} rejected (see console).</span>`
      : `<span class="ok">✓ ${report.length} street${report.length !== 1 ? 's' : ''} loaded.</span>`;
  }

  function selectedPlaylist() {
    const v = $('#streetPicker').value;
    if (v === '__all__') return Array.from(library.values());
    const s = library.get(v);
    return s ? [s] : Array.from(library.values());
  }

  // ---- HUD ----------------------------------------------------------------
  function renderHUD(s) {
    $('#hudScore').textContent = s.score.toLocaleString();
    $('#hudLives').innerHTML = s.lives > 0 ? `${FROG_ICON} <span class="life-count">× ${s.lives}</span>` : '—';
    $('#hudTime').textContent = s.time.toFixed(1) + 's';
    $('#hudStreet').textContent = `${s.streetName}  (${s.streetNum}/${s.streetTotal})`;
  }

  // ---- Banner — the ONLY play/resume CTA ----------------------------------
  let bannerTimer = null;
  function showBanner(title, sub) {
    const b = $('#banner');
    const btn = $('#bannerBtn');

    if (!title) { b.classList.remove('show'); return; }

    $('#bannerTitle').textContent = title;
    $('#bannerSub').textContent = sub || '';
    b.classList.add('show');
    clearTimeout(bannerTimer);

    const terminal = /GAME OVER|WON THE CITY/.test(title);
    const paused   = title === 'Paused';
    const initial  = title === TITLE;
    const showBtn  = terminal || paused || initial;

    btn.hidden = !showBtn;
    btn.classList.toggle('pulse', terminal || initial);

    if (paused)        { btn.textContent = '▶ Resume';    btn.onclick = resumeGame; }
    else if (terminal) { btn.textContent = '↻ Play Again'; btn.onclick = startGame; }
    else               { btn.textContent = '▶ Play';       btn.onclick = startGame; }

    if (!showBtn) bannerTimer = setTimeout(() => b.classList.remove('show'), 1500);
  }

  // ---- Difficulty ---------------------------------------------------------
  let difficulty = G.DEFAULT_DIFFICULTY;
  function setDifficulty(key) {
    difficulty = key;
    game.setDifficulty(key);
    document.querySelectorAll('#difficulty .seg').forEach((b) => {
      b.classList.toggle('active', b.dataset.diff === key);
    });
  }
  document.querySelectorAll('#difficulty .seg').forEach((b) => {
    b.addEventListener('click', () => setDifficulty(b.dataset.diff));
  });

  // ---- Game control -------------------------------------------------------
  function startGame() {
    $('#banner').classList.remove('show');
    game.setDifficulty(difficulty);
    game.load(selectedPlaylist());
    game._sized = false;
    game.start();
    $('#pauseBtn').disabled = false;
    $('#pauseBtn').textContent = '⏸';
  }

  function togglePauseUI() {
    const paused = game.togglePause();
    $('#pauseBtn').textContent = paused ? '▶' : '⏸';
  }

  function resumeGame() {
    if (game.paused) togglePauseUI();
  }

  $('#pauseBtn').addEventListener('click', togglePauseUI);

  // D-pad — pointerdown so there's no tap delay on mobile
  document.querySelectorAll('[data-move]').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const [dx, dy] = btn.dataset.move.split(',').map(Number);
      game.move(dx, dy);
    });
  });

  // Keyboard: P = pause, Space/Enter = play when idle
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' && game.running)             { e.preventDefault(); togglePauseUI(); }
    if ((e.code === 'Space' || e.code === 'Enter') && !game.running) { e.preventDefault(); startGame(); }
  });

  // Editor
  $('#editorBtn').addEventListener('click', () => G.openEditor(library, (street) => {
    library.set(street.id, street);
    populatePicker();
    $('#streetPicker').value = street.id;
    startGame();
  }));

  // ---- Boot ---------------------------------------------------------------
  setDifficulty(G.DEFAULT_DIFFICULTY);
  // Wire the Play button synchronously so an eager click works even while the
  // street library is still being fetched. startGame() falls back to a built-in
  // street if the picker hasn't been populated yet, so it's safe to call early.
  showBanner(TITLE, 'Pick a street below, then tap Play.');
  loadLibrary();
  window.addEventListener('resize', () => { game._sized = false; });
})();
