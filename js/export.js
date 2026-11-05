// Export utilities: PNG sheet, individual PNG frames, Godot .tres resource, and zip bundling.
// Uses JSZip (CDN) + a backend-free download flow via anchor click on object URLs.
// Note: per sandbox rules, forced binary downloads need a backend OR we rely on
// the browser's native anchor-click download behavior with blob: URLs (works fine
// outside the iframe proxy fetch restriction, since this doesn't use fetch()).

import { buildSpriteSheet, gridToCanvas, canvasToBlob } from './render.js';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadSpriteSheet(frames, size, baseName) {
  const canvas = buildSpriteSheet(frames, size);
  const blob = await canvasToBlob(canvas);
  triggerDownload(blob, `${baseName}_sheet.png`);
}

export async function downloadIndividualFrames(frames, size, baseName) {
  const zip = new window.JSZip();
  for (let i = 0; i < frames.length; i++) {
    const canvas = gridToCanvas(frames[i], size);
    const blob = await canvasToBlob(canvas);
    zip.file(`${baseName}_${String(i).padStart(2, '0')}.png`, blob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  triggerDownload(content, `${baseName}_frames.zip`);
}

// Builds a Godot 4.x SpriteFrames .tres resource referencing an AtlasTexture
// sliced from the sheet PNG, so it can be dropped into an AnimatedSprite2D.
export function buildGodotTres({ baseName, size, frameCount, animName = 'default', fps = 6 }) {
  let subResources = '';
  let atlasRefs = '';
  for (let i = 0; i < frameCount; i++) {
    const idx = i + 1;
    subResources += `
[sub_resource type="AtlasTexture" id="AtlasTexture_${idx}"]
atlas = ExtResource("1")
region = Rect2(${i * size}, 0, ${size}, ${size})
`;
    atlasRefs += `SubResource("AtlasTexture_${idx}"), `;
  }
  atlasRefs = atlasRefs.slice(0, -2);

  return `[gd_resource type="SpriteFrames" load_steps=${frameCount + 2} format=3]

[ext_resource type="Texture2D" path="res://${baseName}_sheet.png" id="1"]
${subResources}
[resource]
animations = [{
"frames": [${Array.from({ length: frameCount }, (_, i) => `{
"duration": 1.0,
"texture": SubResource("AtlasTexture_${i + 1}")
}`).join(', ')}],
"loop": true,
"name": &"${animName}",
"speed": ${fps}.0
}]
`;
}

// Builds a minimal Godot 4.x TileSet-friendly note file (as a .tres comment header)
// plus instructions — full TileSet resource authoring requires the editor UI,
// so we ship the atlas PNG + a starter .tres stub referencing it as a texture.
export function buildGodotTileStub({ baseName, size, count }) {
  return `[gd_resource type="Texture2D" load_steps=2 format=3]

[ext_resource type="Image" path="res://${baseName}_sheet.png" id="1"]

[resource]
; PixelForge tileset atlas — ${count} tiles at ${size}x${size}px each, laid out in a single row.
; In Godot 4: create a new TileSet resource, add this PNG as an "Atlas" source,
; set tile size to ${size}x${size}, and Godot will auto-slice the ${count} tiles.
`;
}

export async function downloadGodotBundle({ frames, size, baseName, kind }) {
  const zip = new window.JSZip();
  const sheetCanvas = buildSpriteSheet(frames, size);
  const sheetBlob = await canvasToBlob(sheetCanvas);
  zip.file(`${baseName}_sheet.png`, sheetBlob);

  for (let i = 0; i < frames.length; i++) {
    const canvas = gridToCanvas(frames[i], size);
    const blob = await canvasToBlob(canvas);
    zip.file(`frames/${baseName}_${String(i).padStart(2, '0')}.png`, blob);
  }

  if (kind === 'sprite') {
    const tres = buildGodotTres({ baseName, size, frameCount: frames.length });
    zip.file(`${baseName}.tres`, tres);
  } else if (kind === 'tileset') {
    const tres = buildGodotTileStub({ baseName, size, count: frames.length });
    zip.file(`${baseName}.tres`, tres);
  } else {
    zip.file(
      `${baseName}_README.txt`,
      `PixelForge icon set — ${frames.length} icons at ${size}x${size}px.\nImport the individual PNGs from /frames as Texture2D resources for TextureRect/TextureButton icons in Godot.`
    );
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerDownload(content, `${baseName}_godot_bundle.zip`);
}
