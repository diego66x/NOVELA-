
export type Category = 'filmes' | 'novelas' | 'series';

export interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number; // in seconds
}

export interface Content {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  coverUrl: string; // Wide image for hero or large display
  type: Category;
  match: number; // % match score
  year: number;
  ageRating: string;
  videoUrl?: string; // For movies
  episodes?: Episode[]; // For novelas/series
  genres: string[];
}

export interface UserProgress {
  [contentId: string]: {
    timestamp: number;
    lastUpdated: number;
    episodeId?: string; // If it's a series
  };
}

export interface EpisodeConfig {
  videoUrl?: string;
}

export interface ContentConfig {
  thumbnailUrl?: string;
  coverUrl?: string;
  description?: string;
  videoUrl?: string;
  title?: string;
  year?: number;
  ageRating?: string;
  match?: number;
  genres?: string[];
  type?: Category; // Novo campo essencial para criação de novos itens
  
  customEpisodes?: Episode[];
  episodes?: { [episodeId: string]: EpisodeConfig };
}

export interface CustomConfig {
  [contentId: string]: ContentConfig;
}
