// Optional AI-assisted generation. Calls OpenAI Images API directly from the
// browser using a user-supplied key (kept only in a JS variable for this
// session — never persisted, never sent anywhere except straight to OpenAI).

let sessionApiKey = '';

export function setApiKey(key) {
  sessionApiKey = key.trim();
}

export function hasApiKey() {
  return !!sessionApiKey;
}

export function clearApiKey() {
  sessionApiKey = '';
}

/**
 * Generates an image from a text prompt via OpenAI's Images API.
 * Returns an HTMLImageElement loaded from a data URL.
 */
export async function generateAIImage(prompt, { size = '1024x1024' } = {}) {
  if (!sessionApiKey) throw new Error('No API key set');

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size,
      n: 1,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `OpenAI request failed (${res.status})`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;
  if (!b64 && !url) throw new Error('No image returned');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  const src = b64 ? `data:image/png;base64,${b64}` : url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
  return img;
}

/**
 * Downscales/quantizes a loaded image to a pixel-art grid matching the
 * palette, returning a canvas ready for preview/export alongside procedural assets.
 */
export function pixelateImageToCanvas(img, targetSize, palette) {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = targetSize;
  srcCanvas.height = targetSize;
  const sctx = srcCanvas.getContext('2d');
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(img, 0, 0, targetSize, targetSize);
  const imgData = sctx.getImageData(0, 0, targetSize, targetSize);

  const paletteRgb = palette.map(hexToRgb);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const r = imgData.data[i];
    const g = imgData.data[i + 1];
    const b = imgData.data[i + 2];
    const nearest = nearestColor(r, g, b, paletteRgb);
    imgData.data[i] = nearest.r;
    imgData.data[i + 1] = nearest.g;
    imgData.data[i + 2] = nearest.b;
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetSize;
  outCanvas.height = targetSize;
  outCanvas.getContext('2d').putImageData(imgData, 0, 0);
  return outCanvas;
}

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function nearestColor(r, g, b, palette) {
  let best = palette[0];
  let bestDist = Infinity;
  for (const c of palette) {
    const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
