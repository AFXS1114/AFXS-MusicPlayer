// AFXS Music Player and Organizer
// SQLite database schema definitions and migration runner

export const SCHEMA_VERSION = 1;

export const CREATE_SONGS = `
CREATE TABLE IF NOT EXISTS songs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uri           TEXT    UNIQUE NOT NULL,
  filename      TEXT    NOT NULL,
  title         TEXT,
  artist        TEXT,
  album         TEXT,
  albumArtist   TEXT,
  genre         TEXT,
  year          INTEGER,
  trackNumber   INTEGER,
  discNumber    INTEGER,
  duration      INTEGER NOT NULL DEFAULT 0,
  artworkUri    TEXT,
  dateAdded     INTEGER NOT NULL,
  dateModified  INTEGER NOT NULL,
  fileSize      INTEGER NOT NULL DEFAULT 0,
  isDeleted     INTEGER NOT NULL DEFAULT 0
);
`;

export const CREATE_ARTISTS = `
CREATE TABLE IF NOT EXISTS artists (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    UNIQUE NOT NULL COLLATE NOCASE
);
`;

export const CREATE_ALBUMS = `
CREATE TABLE IF NOT EXISTS albums (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL COLLATE NOCASE,
  artist      TEXT,
  albumArtist TEXT,
  year        INTEGER,
  artworkUri  TEXT,
  UNIQUE(title, albumArtist)
);
`;

export const CREATE_GENRES = `
CREATE TABLE IF NOT EXISTS genres (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL COLLATE NOCASE
);
`;

export const CREATE_PLAYLISTS = `
CREATE TABLE IF NOT EXISTS playlists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  artworkUri  TEXT,
  createdAt   INTEGER NOT NULL,
  updatedAt   INTEGER NOT NULL
);
`;

export const CREATE_PLAYLIST_SONGS = `
CREATE TABLE IF NOT EXISTS playlist_songs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  playlistId INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  songId     INTEGER NOT NULL REFERENCES songs(id)     ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  addedAt    INTEGER NOT NULL,
  UNIQUE(playlistId, songId)
);
`;

export const CREATE_FAVORITES = `
CREATE TABLE IF NOT EXISTS favorites (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  songId  INTEGER NOT NULL UNIQUE REFERENCES songs(id) ON DELETE CASCADE,
  addedAt INTEGER NOT NULL
);
`;

export const CREATE_PLAY_HISTORY = `
CREATE TABLE IF NOT EXISTS play_history (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  songId            INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  playedAt          INTEGER NOT NULL,
  completionPercent REAL
);
`;

export const CREATE_LYRICS_CACHE = `
CREATE TABLE IF NOT EXISTS lyrics_cache (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  songId      INTEGER NOT NULL UNIQUE REFERENCES songs(id) ON DELETE CASCADE,
  source      TEXT    NOT NULL,
  isTimestamped INTEGER NOT NULL DEFAULT 0,
  content     TEXT    NOT NULL,
  cachedAt    INTEGER NOT NULL
);
`;

export const CREATE_ORGANIZATION_HISTORY = `
CREATE TABLE IF NOT EXISTS organization_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  songId        INTEGER REFERENCES songs(id) ON DELETE SET NULL,
  originalUri   TEXT    NOT NULL,
  newUri        TEXT    NOT NULL,
  operationType TEXT    NOT NULL DEFAULT 'move',
  status        TEXT    NOT NULL DEFAULT 'pending',
  errorMessage  TEXT,
  performedAt   INTEGER NOT NULL
);
`;

export const CREATE_SCHEMA_VERSION = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);
`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_songs_artist    ON songs(artist)`,
  `CREATE INDEX IF NOT EXISTS idx_songs_album     ON songs(album)`,
  `CREATE INDEX IF NOT EXISTS idx_songs_genre     ON songs(genre)`,
  `CREATE INDEX IF NOT EXISTS idx_songs_dateAdded ON songs(dateAdded DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_songs_title     ON songs(title)`,
  `CREATE INDEX IF NOT EXISTS idx_songs_isDeleted ON songs(isDeleted)`,
  `CREATE INDEX IF NOT EXISTS idx_play_history_songId   ON play_history(songId)`,
  `CREATE INDEX IF NOT EXISTS idx_play_history_playedAt ON play_history(playedAt DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlistId, position)`,
];

export const ALL_TABLES = [
  CREATE_SCHEMA_VERSION,
  CREATE_SONGS,
  CREATE_ARTISTS,
  CREATE_ALBUMS,
  CREATE_GENRES,
  CREATE_PLAYLISTS,
  CREATE_PLAYLIST_SONGS,
  CREATE_FAVORITES,
  CREATE_PLAY_HISTORY,
  CREATE_LYRICS_CACHE,
  CREATE_ORGANIZATION_HISTORY,
  ...CREATE_INDEXES,
];
