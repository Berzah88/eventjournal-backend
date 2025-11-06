export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  url: string;
  imageUrl: string;
  venue: {
    name: string;
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  category: string;
  isOnline: boolean;
  source: string; // 'duckduckgo', 'google', 'manual'
  scrapedAt: string;
}

export interface UserProfile {
  userId: string;
  location: {
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  streaming?: {
    spotify?: {
      topArtists: string[];
      topGenres: string[];
    };
    netflix?: {
      watchedGenres: string[];
    };
  };
  preferences: {
    categories: string[];
    distance: number;
  };
}

export interface SearchQuery {
  query: string;
  category: string;
  priority: number;
}

export interface ScoredEvent {
  event: Event;
  score: number;
  reasons: string[];
}
