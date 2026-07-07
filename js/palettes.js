// Curated pixel-art palettes (hex arrays). Each palette works for sprites, tiles, and icons.

export const PALETTES = {
  forest: {
    label: 'Forest',
    colors: ['#0d1b0f', '#1f3d20', '#3f6b32', '#7cab48', '#c4dd88', '#e9f2c9'],
  },
  dungeon: {
    label: 'Dungeon',
    colors: ['#1a1015', '#3b2331', '#6b3f4f', '#9a6262', '#c99277', '#e8c9a3'],
  },
  ember: {
    label: 'Ember',
    colors: ['#1a0e0a', '#4a1508', '#a12c1f', '#e1601f', '#f5a623', '#ffe08a'],
  },
  glacier: {
    label: 'Glacier',
    colors: ['#0b1c2b', '#164863', '#2986a8', '#63c2d4', '#a9e5ec', '#eafcff'],
  },
  desert: {
    label: 'Desert',
    colors: ['#2b1c0f', '#5c3a1e', '#a1682f', '#d19b4c', '#e8c988', '#f7e9c6'],
  },
  void: {
    label: 'Void',
    colors: ['#0a0a12', '#1f1a3d', '#4a3d7a', '#8064c9', '#c29ef0', '#efe0ff'],
  },
  toxic: {
    label: 'Toxic',
    colors: ['#0e1408', '#1f3d0f', '#4a7a1f', '#9fe645', '#d4f57a', '#f3ffd6'],
  },
  royal: {
    label: 'Royal',
    colors: ['#12081f', '#2e0f4f', '#5c1e8a', '#a13ecf', '#d98cf0', '#f5dcff'],
  },
  coin: {
    label: 'Coin',
    colors: ['#2b1c05', '#5c3d0a', '#b8860b', '#f0c95b', '#ffe9a3', '#fff8dd'],
  },
  slate: {
    label: 'Slate',
    colors: ['#0d1013', '#232b32', '#455261', '#6f8497', '#a4b6c4', '#dbe4ea'],
  },
};

export function getPalette(key) {
  return PALETTES[key] || PALETTES.forest;
}

export function paletteList() {
  return Object.entries(PALETTES).map(([key, v]) => ({ key, ...v }));
}
