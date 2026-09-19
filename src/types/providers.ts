// AFXS Music Player and Organizer
// Future online provider interfaces (Phase 1: interfaces only, no implementation)

export interface OnlineTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artworkUrl: string | null;
  streamUrl: string | null;
  provider: string;
}

export interface OnlineArtist {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  provider: string;
}

export interface OnlineAlbum {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  artworkUrl: string | null;
  tracks: OnlineTrack[];
  provider: string;
}

export interface OnlineStream {
  url: string;
  format: string;
  quality: string;
  expiresAt: number | null;
}

// Primary online provider contract
export interface OnlineMusicProvider {
  readonly id: string;
  readonly name: string;
  readonly isAuthenticated: boolean;
  search(query: string): Promise<OnlineTrack[]>;
  getTrack(id: string): Promise<OnlineTrack | null>;
  getArtist(id: string): Promise<OnlineArtist | null>;
  getAlbum(id: string): Promise<OnlineAlbum | null>;
  getStream(trackId: string): Promise<OnlineStream | null>;
}

export interface MetadataProvider {
  readonly id: string;
  readonly name: string;
  searchByTitle(title: string, artist?: string, album?: string): Promise<MetadataMatch[]>;
  searchByAlbum(album: string, artist?: string): Promise<MetadataMatch[]>;
}

export interface MetadataMatch {
  confidence: number; // 0–1
  needsReview: boolean;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  trackNumber: number | null;
  discNumber: number | null;
  year: number | null;
  genre: string | null;
  artworkUrl: string | null;
  provider: string;
}

export interface ArtworkProvider {
  readonly id: string;
  readonly name: string;
  searchArtwork(album: string, artist: string): Promise<ArtworkResult[]>;
}

export interface ArtworkResult {
  url: string;
  width: number;
  height: number;
  source: string;
}

// Provider manager (to be implemented when online mode is added)
export interface ProviderManager {
  musicProviders: OnlineMusicProvider[];
  metadataProviders: MetadataProvider[];
  artworkProviders: ArtworkProvider[];
  registerMusicProvider(provider: OnlineMusicProvider): void;
  registerMetadataProvider(provider: MetadataProvider): void;
  registerArtworkProvider(provider: ArtworkProvider): void;
}
