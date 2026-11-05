import { createRng, randomSeed } from './prng.js';
import { paletteList, getPalette } from './palettes.js';
import { generateSprite } from './generators/sprite.js';
import { generateTileset } from './generators/tileset.js';
import { generateIconSet } from './generators/icon.js';
import { drawGridToCanvas, gridToCanvas } from './render.js';
import { downloadSpriteSheet, downloadIndividualFrames, downloadGodotBundle } from './export.js';
import { setApiKey, hasApiKey, clearApiKey, generateAIImage, pixelateImageToCanvas } from './ai.js';
import { ICONS } from './icons.js';

// ---------- Icon injection ----------
document.getElementById('logoMark').innerHTML = ICONS.logo;
document.getElementById('randomSeedBtn').innerHTML = ICONS.dice;
document.getElementById('keyIcon').innerHTML = ICONS.key;
document.getElementById('generateIcon').innerHTML = ICONS.sparkles;
document.getElementById('zoomOutBtn').innerHTML = ICONS.zoomOut;
document.getElementById('zoomInBtn').innerHTML = ICONS.zoomIn;
document.getElementById('playBtn').innerHTML = ICONS.play;
document.getElementById('btnProcedural').innerHTML = ICONS.cpu + '<span>Procedural</span>';
document.getElementById('btnAI').innerHTML = ICONS.sparkles + '<span>AI-assisted</span>';
document.querySelectorAll('.export-icon').forEach((el) => {
  el.innerHTML = ICONS[el.dataset.icon] || '';
});

// ---------- Theme toggle ----------
(function () {
  const t = document.getElementById('themeToggle');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  t.innerHTML = d === 'dark' ? ICONS.sun : ICONS.moon;
  t.addEventListener('click', () => {
    d = d === 'dark' ? 'light' : 'dark';
    r.setAttribute('data-theme', d);
    t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode');
    t.innerHTML = d === 'dark' ? ICONS.sun : ICONS.moon;
  });
})();

// ---------- State ----------
const state = {
  category: 'sprite', // sprite | tileset | icon
  mode: 'procedural', // procedural | ai
  seed: 'godot-hero',
  size: 32,
  frameCount: 4,
  count: 6,
  complexity: 0.5,
  paletteKey: 'forest',
  frames: [],
  currentFrame: 0,
  zoom: 8,
  animating: false,
  animTimer: null,
  gallery: [],
};

// ---------- Palette swatches ----------
const paletteRow = document.getElementById('paletteRow');
function renderPalettes() {
  paletteRow.innerHTML = '';
  paletteList().forEach((p) => {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(p.key === state.paletteKey));
    btn.setAttribute('aria-selected', String(p.key === state.paletteKey));
    btn.setAttribute('aria-label', p.label + ' palette');
    btn.title = p.label;
    btn.innerHTML = `<span style="background:linear-gradient(135deg, ${p.colors[1]} 0%, ${p.colors[2]} 35%, ${p.colors[3]} 70%, ${p.colors[4]} 100%);"></span>`;
    btn.addEventListener('click', () => {
      state.paletteKey = p.key;
      renderPalettes();
      regenerate();
    });
    paletteRow.appendChild(btn);
  });
}
renderPalettes();

// ---------- Tab / mode switching ----------
document.querySelectorAll('[data-category]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-category]').forEach((b) => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');
    state.category = btn.dataset.category;
    document.getElementById('frameCountField').style.display = state.category === 'sprite' ? '' : 'none';
    document.getElementById('countField').style.display = state.category === 'sprite' ? 'none' : '';
    regenerate();
  });
});
document.getElementById('frameCountField').style.display = '';
document.getElementById('countField').style.display = 'none';

document.getElementById('btnProcedural').addEventListener('click', () => setMode('procedural'));
document.getElementById('btnAI').addEventListener('click', () => setMode('ai'));

function setMode(mode) {
  state.mode = mode;
  document.getElementById('btnProcedural').setAttribute('aria-selected', String(mode === 'procedural'));
  document.getElementById('btnAI').setAttribute('aria-selected', String(mode === 'ai'));
  document.getElementById('proceduralControls').style.display = mode === 'procedural' ? '' : 'none';
  document.getElementById('aiControls').style.display = mode === 'ai' ? '' : 'none';
  document.getElementById('modeBadge').textContent = mode === 'procedural' ? 'Free · Procedural' : 'AI-assisted';
  document.getElementById('modeHint').textContent =
    mode === 'procedural'
      ? 'Instant, algorithmic generation. No API key, no cost, works offline.'
      : 'Uses your own OpenAI key. Usage costs apply on your OpenAI account.';
}

// ---------- Inputs ----------
document.getElementById('seedInput').addEventListener('input', (e) => {
  state.seed = e.target.value || 'seed';
});
document.getElementById('randomSeedBtn').addEventListener('click', () => {
  state.seed = randomSeed();
  document.getElementById('seedInput').value = state.seed;
  regenerate();
});
document.getElementById('sizeSelect').addEventListener('change', (e) => {
  state.size = parseInt(e.target.value, 10);
  regenerate();
});
document.getElementById('frameCountRange').addEventListener('input', (e) => {
  state.frameCount = parseInt(e.target.value, 10);
  document.getElementById('frameCountVal').textContent = state.frameCount;
});
document.getElementById('frameCountRange').addEventListener('change', regenerate);
document.getElementById('countRange').addEventListener('input', (e) => {
  state.count = parseInt(e.target.value, 10);
  document.getElementById('countVal').textContent = state.count;
});
document.getElementById('countRange').addEventListener('change', regenerate);
document.getElementById('complexityRange').addEventListener('input', (e) => {
  state.complexity = parseFloat(e.target.value);
  document.getElementById('complexityVal').textContent = state.complexity.toFixed(2);
});
document.getElementById('complexityRange').addEventListener('change', regenerate);

document.getElementById('zoomInBtn').addEventListener('click', () => {
  state.zoom = Math.min(24, state.zoom + 2);
  document.getElementById('zoomLabel').textContent = state.zoom + '×';
  renderPreview();
});
document.getElementById('zoomOutBtn').addEventListener('click', () => {
  state.zoom = Math.max(2, state.zoom - 2);
  document.getElementById('zoomLabel').textContent = state.zoom + '×';
  renderPreview();
});

// ---------- API key modal ----------
const keyModal = document.getElementById('keyModal');
document.getElementById('manageKeyBtn').addEventListener('click', () => {
  keyModal.style.display = 'flex';
});
document.getElementById('cancelKeyBtn').addEventListener('click', () => {
  keyModal.style.display = 'none';
});
document.getElementById('saveKeyBtn').addEventListener('click', () => {
  const key = document.getElementById('apiKeyInput').value;
  if (key.trim()) {
    setApiKey(key);
    document.getElementById('keyStatusLabel').textContent = 'Key set · click to change';
    showToast('API key saved for this session');
  }
  keyModal.style.display = 'none';
});
keyModal.addEventListener('click', (e) => {
  if (e.target === keyModal) keyModal.style.display = 'none';
});

// ---------- Generation ----------
document.getElementById('generateBtn').addEventListener('click', regenerate);

async function regenerate() {
  stopAnimation();
  const btn = document.getElementById('generateBtn');
  const label = document.getElementById('generateLabel');
  const icon = document.getElementById('generateIcon');

  if (state.mode === 'ai') {
    const prompt = document.getElementById('aiPrompt').value.trim();
    if (!hasApiKey()) {
      keyModal.style.display = 'flex';
      return;
    }
    if (!prompt) {
      showToast('Describe what you want to generate first');
      return;
    }
    btn.disabled = true;
    icon.innerHTML = `<span class="spin">${ICONS.sparkles}</span>`;
    label.textContent = 'Generating…';
    try {
      const img = await generateAIImage(prompt);
      const palette = getPalette(state.paletteKey);
      const canvas = pixelateImageToCanvas(img, state.size, palette.colors);
      const grid = canvasToGrid(canvas, state.size);
      state.frames = [grid];
      state.currentFrame = 0;
      renderPreview();
      renderFrameStrip();
      addToGallery(grid, state.size);
      showToast('AI asset generated');
    } catch (err) {
      showToast(err.message || 'Generation failed');
    } finally {
      btn.disabled = false;
      icon.innerHTML = ICONS.sparkles;
      label.textContent = 'Generate';
    }
    return;
  }

  const rng = createRng(state.seed + '|' + state.category + '|' + state.paletteKey);
  const palette = getPalette(state.paletteKey);
  let result;
  if (state.category === 'sprite') {
    result = generateSprite({
      rng,
      size: state.size,
      frameCount: state.frameCount,
      complexity: state.complexity,
      colors: palette.colors,
    });
  } else if (state.category === 'tileset') {
    result = generateTileset({
      rng,
      size: state.size,
      count: state.count,
      density: state.complexity,
      colors: palette.colors,
    });
  } else {
    result = generateIconSet({
      rng,
      size: state.size,
      count: state.count,
      colors: palette.colors,
    });
  }

  state.frames = result.frames;
  state.currentFrame = 0;
  renderPreview();
  renderFrameStrip();
  document.getElementById('previewLabel').textContent = `${state.size}×${state.size} · seed: ${state.seed}`;
  document.getElementById('playBtn').style.display = state.category === 'sprite' && state.frames.length > 1 ? '' : 'none';
  result.frames.forEach((grid) => addToGallery(grid, state.size));
}

function canvasToGrid(canvas, size) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, size, size).data;
  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const a = data[i + 3];
      row.push(a < 10 ? null : `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`);
    }
    grid.push(row);
  }
  return grid;
}

// ---------- Preview rendering ----------
const previewCanvas = document.getElementById('previewCanvas');
function renderPreview() {
  if (!state.frames.length) return;
  const grid = state.frames[state.currentFrame];
  drawGridToCanvas(previewCanvas, grid, state.size, state.zoom);
}

function renderFrameStrip() {
  const strip = document.getElementById('frameStrip');
  strip.innerHTML = '';
  state.frames.forEach((grid, i) => {
    const thumb = document.createElement('button');
    thumb.className = 'frame-thumb';
    thumb.setAttribute('role', 'listitem');
    thumb.setAttribute('aria-selected', String(i === state.currentFrame));
    thumb.setAttribute('aria-label', `Frame ${i + 1}`);
    const c = document.createElement('canvas');
    drawGridToCanvas(c, grid, state.size, 1);
    thumb.appendChild(c);
    const num = document.createElement('span');
    num.className = 'frame-num';
    num.textContent = i + 1;
    thumb.appendChild(num);
    thumb.addEventListener('click', () => {
      stopAnimation();
      state.currentFrame = i;
      renderPreview();
      document.querySelectorAll('.frame-thumb').forEach((t, idx) => t.setAttribute('aria-selected', String(idx === i)));
    });
    strip.appendChild(thumb);
  });
}

// ---------- Play animation ----------
const playBtn = document.getElementById('playBtn');
playBtn.addEventListener('click', () => {
  if (state.animating) stopAnimation();
  else startAnimation();
});
function startAnimation() {
  if (state.frames.length < 2) return;
  state.animating = true;
  playBtn.innerHTML = ICONS.pause;
  state.animTimer = setInterval(() => {
    state.currentFrame = (state.currentFrame + 1) % state.frames.length;
    renderPreview();
    document.querySelectorAll('.frame-thumb').forEach((t, idx) => t.setAttribute('aria-selected', String(idx === state.currentFrame)));
  }, 220);
}
function stopAnimation() {
  state.animating = false;
  playBtn.innerHTML = ICONS.play;
  if (state.animTimer) clearInterval(state.animTimer);
  state.animTimer = null;
}

// ---------- Gallery ----------
const galleryGrid = document.getElementById('galleryGrid');
function addToGallery(grid, size) {
  state.gallery.unshift({ grid, size });
  if (state.gallery.length > 24) state.gallery.pop();
  renderGallery();
}
function renderGallery() {
  const empty = document.getElementById('galleryEmpty');
  if (state.gallery.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  galleryGrid.innerHTML = '';
  if (empty) galleryGrid.appendChild(empty);
  state.gallery.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    const c = document.createElement('canvas');
    drawGridToCanvas(c, item.grid, item.size, 1);
    div.appendChild(c);
    div.addEventListener('click', () => {
      state.frames = [item.grid];
      state.size = item.size;
      state.currentFrame = 0;
      renderPreview();
      renderFrameStrip();
    });
    galleryGrid.appendChild(div);
  });
}

// ---------- Export ----------
document.getElementById('exportSheetBtn').addEventListener('click', async () => {
  if (!state.frames.length) return showToast('Generate an asset first');
  await downloadSpriteSheet(state.frames, state.size, `pixelforge_${state.category}`);
  showToast('Sprite sheet downloaded');
});
document.getElementById('exportFramesBtn').addEventListener('click', async () => {
  if (!state.frames.length) return showToast('Generate an asset first');
  await downloadIndividualFrames(state.frames, state.size, `pixelforge_${state.category}`);
  showToast('Frames downloaded as .zip');
});
document.getElementById('exportGodotBtn').addEventListener('click', async () => {
  if (!state.frames.length) return showToast('Generate an asset first');
  await downloadGodotBundle({
    frames: state.frames,
    size: state.size,
    baseName: `pixelforge_${state.category}`,
    kind: state.category,
  });
  showToast('Godot bundle downloaded');
});

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ---------- Init ----------
regenerate();
