# PixelForge — Spec Doc

## Concept
A free, in-browser generator for Godot-ready 2D game assets. Procedural generation is instant and free (no API key); an optional AI mode can be toggled on if the user supplies their own OpenAI API key. Everything runs client-side — no accounts, no server, no database.

## Target user
Solo/small-team Godot developers who want quick placeholder or final-pass 2D art (characters, tiles, icons) without waiting on a human artist or paying per-image AI costs for early iteration.

## Core features

### 1. Asset categories
- **Sprites/Characters** — humanoid-ish procedural sprite generator: body, head, palette-swapped outfit, simple idle/walk frame variations (2-4 frames).
- **Tilesets** — seamless-tileable ground/wall tiles generated from a base palette + pattern algorithm (grass, stone, sand, water, dungeon, etc.), output as a tileset grid.
- **Icons/UI** — inventory/item icons and HUD glyphs (potions, coins, hearts, swords, gems, buttons) generated from parametric shape + palette combos.

### 2. Generation modes (toggle)
- **Procedural (default, free)** — deterministic algorithmic generation using a seeded PRNG. Adjustable params: seed, palette, size (16/32/64 px grid), symmetry, density/complexity. Regenerate instantly, no network call.
- **AI-assisted (optional)** — user pastes their own OpenAI API key (stored in-memory only, never persisted or sent anywhere but directly to OpenAI from the browser). Text prompt → generated image via DALL·E/gpt-image, downscaled/quantized client-side to pixel-art style. Toggle switches the generation panel; procedural remains fully usable without a key.

### 3. Live preview
- Canvas-based preview with pixel-perfect (nearest-neighbor) zoom, checkerboard transparency background, and animation playback for sprite frames.

### 4. Export
- **PNG sprite sheet** — all frames/variations tiled into one PNG with transparent background.
- **Individual PNG frames** — each frame/variation as a separately downloadable numbered PNG.
- **Godot resource files** — a generated `.tres` `SpriteFrames`/`AtlasTexture` resource (and a matching `.import`-friendly PNG) so the sheet can be dropped straight into a Godot `AnimatedSprite2D` or `TileSet`.
- Batch download as a `.zip` containing PNGs + `.tres` for one-click drop into a Godot project's `res://` folder.

### 5. History / gallery
- In-session gallery of generated assets (kept in memory for the session — no localStorage per sandbox constraints) so the user can flip between recent generations before exporting.

## Non-goals (explicitly out of scope for v1)
- Real-time multi-user collaboration (original CoScreen-style request) — dropped per user decision in favor of this generator.
- Remote OS-level screen/input control — not possible from a browser sandbox regardless of framework.
- Persistent server-side storage/accounts — not needed since assets are generated and exported locally per session.
- Sound/music generation — deferred; only visual assets in v1.

## Stack
- **Frontend-only static app.** No backend/database — nothing needs to persist across sessions server-side.
- **HTML5 Canvas + vanilla JavaScript (ES modules)** for the procedural generation engine (seeded PRNG, palette system, sprite/tile/icon algorithms).
- **Tailwind CSS (CDN)** for UI chrome, styled as a dark "dev tool" interface.
- **JSZip (CDN)** for bundling multi-file exports into a single `.zip` download.
- **OpenAI Images API** called directly from the browser for the optional AI mode (user-supplied key, kept in a JS variable only for the session).
- Deployed as a static site (HTML/CSS/JS bundle) — no build step required.

## Godot integration notes
- Sprite sheets export at power-of-2-friendly frame sizes (16/32/64px) for clean `AtlasTexture` slicing.
- `.tres` output uses Godot 4.x `SpriteFrames` resource format so it can be assigned directly to an `AnimatedSprite2D` node's Frames property.
- Tileset exports are laid out as a uniform grid PNG compatible with Godot's `TileSet` "Atlas" import mode.
