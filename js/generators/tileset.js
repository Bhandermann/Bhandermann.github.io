// Procedural tileset generator — seamless tileable ground/wall tiles.

/**
 * Generates a set of tileable tile variations sharing one base pattern.
 * @param {object} opts
 * @param {number} opts.size - tile size in px (16/32/64)
 * @param {number} opts.count - number of tile variations (usually 4-9)
 * @param {number} opts.density - 0..1 speckle/detail density
 * @param {string[]} opts.colors
 */
export function generateTileset({ rng, size = 32, count = 6, density = 0.4, colors }) {
  const [outline, shadow, base, accent, highlight, light] = colors;
  const frames = [];

  for (let t = 0; t < count; t++) {
    const grid = Array.from({ length: size }, () => new Array(size).fill(base));

    // Base speckle noise, wrapped for seamlessness (toroidal sampling).
    const speckleCount = Math.floor(size * size * density * 0.5);
    for (let i = 0; i < speckleCount; i++) {
      const x = rng.int(0, size - 1);
      const y = rng.int(0, size - 1);
      const c = rng.bool(0.6) ? shadow : accent;
      grid[y][x] = c;
    }

    // Scatter small clusters (2x2 or plus-shapes) for organic texture, wrapping at edges.
    const clusterCount = Math.floor(3 + density * 6);
    for (let i = 0; i < clusterCount; i++) {
      const cx = rng.int(0, size - 1);
      const cy = rng.int(0, size - 1);
      const col = rng.pick([highlight, light, shadow]);
      const shape = rng.bool() ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of shape) {
        const gx = (((cx + dx) % size) + size) % size;
        const gy = (((cy + dy) % size) + size) % size;
        grid[gy][gx] = col;
      }
    }

    // Subtle grid-edge outline for a "tile" feel (top+left only, so tiles read as a grid when placed adjacent)
    if (rng.bool(0.5)) {
      for (let x = 0; x < size; x++) grid[0][x] = shadow;
      for (let y = 0; y < size; y++) grid[y][0] = shadow;
    }

    frames.push(grid);
  }

  return { frames, size, light };
}
