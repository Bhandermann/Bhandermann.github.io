// Procedural icon/UI element generator — parametric shape-based icons
// (potion, coin, heart, sword, gem, shield) built on a symmetric grid.

const SHAPES = ['potion', 'coin', 'heart', 'sword', 'gem', 'shield'];

export function generateIconSet({ rng, size = 32, count = 6, colors }) {
  const [outline, shadow, base, accent, highlight, light] = colors;
  const frames = [];
  const shapesUsed = [];

  for (let i = 0; i < count; i++) {
    const shape = SHAPES[i % SHAPES.length];
    shapesUsed.push(shape);
    const grid = Array.from({ length: size }, () => new Array(size).fill(null));
    const cx = size / 2;
    const cy = size / 2;

    const set = (x, y, c) => {
      if (x >= 0 && x < size && y >= 0 && y < size) grid[y][x] = c;
    };

    if (shape === 'heart') {
      const s = size * 0.32;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = (x - cx) / s;
          const ny = (y - cy * 0.85) / s;
          const val = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
          if (val <= 0 && ny > -1.3) set(x, y, base);
        }
      }
      outlineShape(grid, size, outline);
      shade(grid, size, highlight, 0.3);
    } else if (shape === 'coin') {
      const r = size * 0.36;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d < r) set(x, y, d < r * 0.65 ? accent : base);
        }
      }
      outlineShape(grid, size, outline);
      // star glint
      set(Math.floor(cx - r * 0.3), Math.floor(cy - r * 0.3), light);
    } else if (shape === 'gem') {
      const w = size * 0.34;
      const topY = cy - size * 0.32;
      const midY = cy - size * 0.05;
      const botY = cy + size * 0.32;
      for (let y = topY; y < botY; y++) {
        let width;
        if (y < midY) {
          width = w * ((y - topY) / (midY - topY));
        } else {
          width = w * (1 - (y - midY) / (botY - midY));
        }
        for (let x = cx - width; x <= cx + width; x++) {
          const c = x < cx ? accent : base;
          set(Math.round(x), Math.round(y), c);
        }
      }
      outlineShape(grid, size, outline);
      shade(grid, size, highlight, 0.25);
    } else if (shape === 'potion') {
      const bodyR = size * 0.24;
      const bodyTop = cy - size * 0.06;
      const bodyBot = cy + size * 0.32;
      for (let y = bodyTop; y < bodyBot; y++) {
        const t = (y - bodyTop) / (bodyBot - bodyTop);
        const r = bodyR * (0.6 + 0.4 * Math.sin(Math.min(t * Math.PI, Math.PI)));
        for (let x = cx - r; x <= cx + r; x++) set(Math.round(x), Math.round(y), base);
      }
      // liquid fill (lower 2/3)
      for (let y = bodyTop + (bodyBot - bodyTop) * 0.35; y < bodyBot; y++) {
        const t = (y - bodyTop) / (bodyBot - bodyTop);
        const r = bodyR * (0.6 + 0.4 * Math.sin(Math.min(t * Math.PI, Math.PI))) - 2;
        for (let x = cx - r; x <= cx + r; x++) set(Math.round(x), Math.round(y), accent);
      }
      // neck + cork
      const neckW = size * 0.08;
      for (let y = cy - size * 0.22; y < bodyTop + 2; y++) {
        for (let x = cx - neckW; x <= cx + neckW; x++) set(Math.round(x), Math.round(y), shadow);
      }
      for (let y = cy - size * 0.3; y < cy - size * 0.2; y++) {
        for (let x = cx - neckW - 1; x <= cx + neckW + 1; x++) set(Math.round(x), Math.round(y), highlight);
      }
      outlineShape(grid, size, outline);
    } else if (shape === 'sword') {
      const bladeW = size * 0.08;
      for (let y = size * 0.08; y < size * 0.62; y++) {
        for (let x = cx - bladeW; x <= cx + bladeW; x++) set(Math.round(x), Math.round(y), light);
      }
      // hilt
      for (let x = cx - size * 0.22; x <= cx + size * 0.22; x++) {
        set(Math.round(x), Math.round(size * 0.62), accent);
        set(Math.round(x), Math.round(size * 0.66), accent);
      }
      for (let y = size * 0.66; y < size * 0.86; y++) {
        for (let x = cx - bladeW * 1.4; x <= cx + bladeW * 1.4; x++) set(Math.round(x), Math.round(y), shadow);
      }
      outlineShape(grid, size, outline);
    } else if (shape === 'shield') {
      const w = size * 0.32;
      for (let y = size * 0.14; y < size * 0.8; y++) {
        const t = (y - size * 0.14) / (size * 0.66);
        const r = t < 0.6 ? w : w * (1 - (t - 0.6) / 0.4);
        for (let x = cx - r; x <= cx + r; x++) set(Math.round(x), Math.round(y), t < 0.15 ? shadow : base);
      }
      // emblem
      for (let y = size * 0.35; y < size * 0.55; y++) {
        for (let x = cx - size * 0.06; x <= cx + size * 0.06; x++) set(Math.round(x), Math.round(y), accent);
      }
      outlineShape(grid, size, outline);
    }

    frames.push(grid);
  }

  return { frames, size, light, shapesUsed };
}

function outlineShape(grid, size, outlineColor) {
  const copy = grid.map((row) => row.slice());
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (copy[y][x]) continue;
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && copy[ny][nx]) {
          grid[y][x] = outlineColor;
          break;
        }
      }
    }
  }
}

function shade(grid, size, color, chance) {
  for (let y = 0; y < size * 0.4; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] && Math.random() < chance * 0.15) grid[y][x] = color;
    }
  }
}
