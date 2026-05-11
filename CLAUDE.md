# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
npm test           # Jest tests (jest-expo preset)
npm run lint       # Expo linter
```

TypeScript path alias `@/*` resolves to repo root — use it for all imports.

## What This App Is

**Flash** — mobile app for creating, sharing, and tracking climbing wall problems (bouldering routes). Users photograph gym walls, mark holds on the wall image, then compose routes from those holds. ML-assisted hold detection (MobileSAM) auto-segments holds from a tap point.

## Architecture

### Data Layer (`DAL/`)

Singleton `DALService` is the only data interface for all screens. It owns:
- Local SQLite DB via `expo-sqlite` (`DAL/tables/`, `DAL/migrations.ts`)
- Remote Firestore + Firebase Storage + Firebase Auth
- A background sync loop (`loadUpdates()`, every 5 min) that merges remote changes into local DB
- EventEmitter for reactive UI updates

Access pattern everywhere: `DALService.getInstance()` → call methods.

Entity classes (`DAL/entities/`) are plain data containers. DAL objects (`DAL/dals/`) handle read/write per entity. `DAL/tables/` has a custom SQL query builder (`BaseTable`) — use its Filter/Sort/Join API, not raw SQL strings.

### Routing (`app/`)

Expo Router file-based routing. Root layout (`app/_layout.tsx`) bootstraps Firebase, SQLite, and auth state. Four tabs in `app/(tabs)/`: My Walls, My Groups, Search, Settings. Modal screens live alongside tabs in `app/(tabs)/`.

### Components

- `components/general/` — shared UI (hold drawing, zoomable image, themed primitives, modals)
- `components/screens/` — screen-specific component trees, one folder per screen

Hold rendering has three implementations chosen based on context:
- `DrawHold` — interactive canvas for hold creation
- `SkiaHold` — Skia GPU-rendered holds for performance
- `SvgHold` — SVG holds for general display

### ML Hold Detection (`hooks/useHoldDetection.ts`)

Two-stage TFLite pipeline (models in `assets/ml/`):
1. Encoder runs once per wall image → embedding
2. Decoder runs per tap point → segmentation mask
3. Mask → SVG path → Hold object

### Core Domain Types

| Entity | Key fields |
|--------|-----------|
| `Wall` | `configuredHolds[]`, `image`, `angle`, `isPublic`, lat/lng |
| `Problem` | `holds[]`, `grade` (0–24 = 5A–9A), `wallId`, `isPublic` |
| `Group` | `members[]`, `problems[]`, `isPublic` |
| `UserTick` | `tag` (sent/attempted/etc.), `problemId` |
| `Hold` | `svgPath`, `color`, `length`, `label` |

Grades are 0-indexed integers; `constants/consts.ts` maps them to display strings (5A–9A).

## Environment

Firebase credentials live in `.env` as `EXPO_PUBLIC_*` vars. `firebaseConfig.js` initializes Firestore, Auth, and Storage. `app.config.js` reads `.env` and passes values to Expo's config plugin.

Metro is configured to handle `.cjs` source extensions and `.tflite` asset extensions (`metro.config.js`).
