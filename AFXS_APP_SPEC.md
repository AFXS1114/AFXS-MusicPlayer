// AFXS Music Player and Organizer — Full Application Specification

# AFXS Music Player and Organizer

**Version:** 1.0.0 (Offline Edition)

This file documents the complete product specification for AFXS Music Player and Organizer.

---

## Core Vision

AFXS Music Player and Organizer is an offline-first Android music application that combines:

1. Local music playback
2. Music library management
3. Music metadata management
4. Album artwork management
5. Lyrics management
6. Music organization
7. Playlists
8. Favorites
9. Playback history
10. Duplicate detection
11. Library scanning and maintenance
12. Future online music and metadata functionality

---

## Technology Stack

- **Framework:** React Native + Expo SDK 57
- **Language:** TypeScript (strict)
- **Navigation:** Expo Router v5
- **Database:** SQLite (expo-sqlite)
- **Audio:** expo-audio
- **Media Library:** expo-media-library (MediaStore wrapper)
- **File System:** expo-file-system
- **Icons:** @expo/vector-icons (MaterialIcons + Ionicons)
- **State:** React Context + useReducer

---

## Design System

- **Color system:** Black-first, flat design, subtle neon accents
- **Accent:** User-selectable from 7 neon presets, persisted locally
- **Typography:** Clean modern sans-serif, consistent hierarchy
- **Icons:** Professional vector icons only — no emoji or cartoon icons

---

## Architecture

```
src/
├── contexts/     # ThemeContext, PlayerContext
├── components/   # SongRow, MiniPlayer, UI, StateViews, IconButton
├── constants/    # theme.ts, colors.ts
├── database/     # schema, db singleton, DAOs
├── services/     # audio, scanner, artwork, lyrics
├── types/        # music, player, lyrics, providers
└── utils/        # format.ts
app/
├── _layout.tsx         # Root layout (providers)
├── player.tsx          # Full player (modal)
└── (tabs)/
    ├── _layout.tsx     # Tab bar + MiniPlayer
    ├── index.tsx       # Home
    ├── library.tsx     # Library (Songs/Artists/Albums/Genres/Folders)
    ├── playlists.tsx   # Playlists
    ├── tools.tsx       # Music Tools
    └── settings.tsx    # Settings
```

---

## Implementation Status

| Feature | Status |
|---|---|
| Navigation (5 tabs) | ✅ Phase 1 |
| SQLite database + all tables | ✅ Phase 1 |
| ThemeContext + accent colors | ✅ Phase 1 |
| PlayerContext + queue | ✅ Phase 1 |
| Music scanner (MediaStore) | ✅ Phase 1 |
| Library views (Songs/Artists/Albums/Genres/Folders) | ✅ Phase 1 |
| Audio playback (expo-audio) | ✅ Phase 1 |
| MiniPlayer | ✅ Phase 1 |
| Full player screen | ✅ Phase 1 |
| Playlists CRUD | ✅ Phase 1 |
| Favorites | ✅ Phase 1 |
| Play history | ✅ Phase 1 |
| Lyrics (LRC + cache) | ✅ Phase 1 |
| Settings + accent picker | ✅ Phase 1 |
| Background playback | ✅ Phase 1 (expo-audio) |
| Metadata Fixer | 🔜 Phase 2 |
| Music Organizer | 🔜 Phase 2 |
| Artwork Manager | 🔜 Phase 2 |
| Duplicate Finder | 🔜 Phase 2 |
| Online providers | 🔜 Phase 3+ |

---

## Safety Rules

- Never silently rename, move, or delete music files
- All bulk operations require: Analyze → Preview → Confirm → Apply
- Never overwrite an existing file without explicit confirmation
- Preserve originals until destination is verified

---

## Online Architecture (Future)

Interfaces are defined in `src/types/providers.ts` for:
- `OnlineMusicProvider`
- `MetadataProvider`
- `ArtworkProvider`
- `ProviderManager`

Online functionality must use only legitimate/authorized sources.
No stream ripping, web scraping, or circumventing platform restrictions.
