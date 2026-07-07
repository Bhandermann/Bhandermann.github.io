// Procedural humanoid sprite generator.
// Produces a grid of pixel indices per frame, mirrored left/right for symmetry.

/**
 * Generates a set of sprite frames.
 * @param {object} opts
 * @param {import('../prng.js').createRng} opts.rng
 * @param {number} opts.size - grid size (16, 32, 64)
 * @param {number} opts.frameCount - number of animation frames (2-4)
 * @param {number} opts.complexity - 0..1 detail density
 * @param {string[]} opts.colors - palette hex array, dark to light
 * @returns {{frames: string[][][], size:number}} frames[f][y][x] = hex color or null
 */
export function generateSprite({ rng, size = 32, frameCount = 4, complexity = 0.5, colors }) {
  const half = Math.floor(size / 2);
  const [outline, shadow, base, accent, highlight, light] = colors;

  // Build a base body silhouette on half-width grid, mirrored.
  const bodyTop = Math.floor(size * 0.12);
  const headH = Math.floor(size * 0.28);
  const torsoH = Math.floor(size * 0.32);
  const legH = size - bodyTop - headH - torsoH;

  const headW = Math.max(3, Math.floor(half * (0.55 + complexity * 0.25)));
  const torsoW = Math.max(3, Math.floor(half * (0.7 + complexity * 0.2)));
  const legW = Math.max(2, Math.floor(half * 0.32));

  function buildFrame(walkOffset) {
    const grid = Array.from({ length: size }, () => new Array(size).fill(null));

    // Head
    for (let y = 0; y < headH; y++) {
      for (let x = 0; x < headW; x++) {
        const gy = bodyTop + y;
        const edge = x === headW - 1 || y === 0 || y === headH - 1;
        grid[gy][half - 1 - x] = edge ? outline : base;
        grid[gy][half + x] = edge ? outline : base;
      }
    }
    // Eye/face detail
    if (complexity > 0.15) {
      const eyeY = bodyTop + Math.floor(headH * 0.55);
      grid[eyeY][half - 2] = shadow;
      grid[eyeY][half + 1] = shadow;
    }

    // Torso
    const torsoTop = bodyTop + headH;
    for (let y = 0; y < torsoH; y++) {
      for (let x = 0; x < torsoW; x++) {
        const gy = torsoTop + y;
        const edge = x === torsoW - 1 || y === torsoH - 1;
        const col = edge ? outline : y < torsoH * 0.4 ? accent : base;
        grid[gy][half - 1 - x] = col;
        grid[gy][half + x] = col;
      }
    }
    // Belt/highlight stripe
    if (complexity > 0.3) {
      const stripeY = torsoTop + Math.floor(torsoH * 0.65);
      for (let x = 0; x < torsoW; x++) {
        grid[stripeY][half - 1 - x] = highlight;
        grid[stripeY][half + x] = highlight;
      }
    }

    // Legs (walk cycle: offset shifts one leg up/down)
    const legTop = torsoTop + torsoH;
    for (let y = 0; y < legH; y++) {
      for (let x = 0; x < legW; x++) {
        const edge = x === legW - 1 || y === legH - 1;
        const leftShift = walkOffset > 0 ? Math.min(walkOffset, legH - 1 - y) : 0;
        const rightShift = walkOffset < 0 ? Math.min(-walkOffset, legH - 1 - y) : 0;
        const gyLeft = Math.min(size - 1, legTop + y + leftShift);
        const gyRight = Math.min(size - 1, legTop + y + rightShift);
        grid[gyLeft][half - 1 - x] = edge ? outline : shadow;
        grid[gyRight][half + x] = edge ? outline : shadow;
      }
    }

    return grid;
  }

  const frames = [];
  const walkPattern = frameCount === 2 ? [0, 0] : frameCount === 3 ? [0, 2, -2] : [0, 2, 0, -2];
  for (let f = 0; f < frameCount; f++) {
    frames.push(buildFrame(walkPattern[f % walkPattern.length]));
  }

  return { frames, size, light };
}
