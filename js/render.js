// Canvas rendering helpers for pixel grids.

export function drawGridToCanvas(canvas, grid, size, scale = 1) {
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = grid[y][x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

export function gridToCanvas(grid, size) {
  const canvas = document.createElement('canvas');
  drawGridToCanvas(canvas, grid, size, 1);
  return canvas;
}

export function buildSpriteSheet(frames, size, columns = frames.length) {
  const rows = Math.ceil(frames.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = size * columns;
  canvas.height = size * rows;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  frames.forEach((grid, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const frameCanvas = gridToCanvas(grid, size);
    ctx.drawImage(frameCanvas, col * size, row * size);
  });
  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
