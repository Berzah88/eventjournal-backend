import axios from 'axios';
import { Event } from '../types';

/**
 * Last.fm Events - Artist concerts (deprecated but still works for some queries)
 * Alternatif: Bandsintown API - Artist tour dates
 */
export class BandsintownAPI {
  private readonly BASE_URL = 'https://rest.bandsintown.com';
  private readonly APP_ID = 'eventjournal'; // Public app ID
  
  async searchByArtist(artistName: string): Promise<Event[]> {
    try {
      console.log(`🎸 Bandsintown: ${artistName} events`);
      
      const response = await axios.get(
        `${this.BASE_URL}/artists/${encodeURIComponent(artistName)}/events`,
        {
          params: {
            app_id: this.APP_ID,
          },
          timeout: 10000,
        }
      );
      
      const events: Event[] = [];
      const items = response.data || [];
      
      if (!Array.isArray(items)) {
        console.log('⚠️ No events found');
        return [];
      }
      
      items.forEach((item: any) => {
        const venue = item.venue;
        
        const event: Event = {
          id: `bandsintown-${item.id}`,
          title: `${artistName} at ${venue.name}`,
          description: item.description || `${artistName} live performance`,
          startDate: item.datetime,
          endDate: item.datetime,
          timezone: venue.timezone || 'UTC',
          url: item.url,
          imageUrl: item.artist?.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
          venue: {
            name: venue.name,
            city: venue.city,
            region: venue.region || venue.state_province || '',
            country: venue.country,
            latitude: parseFloat(venue.latitude) || 0,
            longitude: parseFloat(venue.longitude) || 0,
          },
          category: 'Music',
          isOnline: false,
          source: 'bandsintown',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ Bandsintown: ${events.length} events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ Bandsintown error:', error.message);
      return [];
    }
  }
  
  async searchByLocation(location: string): Promise<Event[]> {
    try {
      console.log(`🎸 Bandsintown: Events in ${location}`);
      
      // Location-based search (requires geocoding first)
      const coords = this.getCoordinates(location);
      if (!coords) {
        console.log('⚠️ Location not found');
        return [];
      }
      
      const response = await axios.get(
        `${this.BASE_URL}/events/search`,
        {
          params: {
            app_id: this.APP_ID,
            location: `${coords.lat},${coords.lon}`,
            radius: 50, // 50km radius
          },
          timeout: 10000,
        }
      );
      
      const events: Event[] = [];
      const items = response.data || [];
      
      items.forEach((item: any) => {
        const venue = item.venue;
        const artists = item.lineup?.join(', ') || 'Various Artists';
        
        const event: Event = {
          id: `bandsintown-${item.id}`,
          title: `${artists} at ${venue.name}`,
          description: item.description || `Live music in ${location}`,
          startDate: item.datetime,
          endDate: item.datetime,
          timezone: venue.timezone || 'UTC',
          url: item.url,
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
          venue: {
            name: venue.name,
            city: venue.city,
            region: venue.region || '',
            country: venue.country,
            latitude: parseFloat(venue.latitude) || 0,
            longitude: parseFloat(venue.longitude) || 0,
          },
          category: 'Music',
          isOnline: false,
          source: 'bandsintown',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ Bandsintown: ${events.length} events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ Bandsintown location search error:', error.message);
      return [];
    }
  }
  
  private getCoordinates(location: string): {lat: number, lon: number} | null {
    const coords: Record<string, {lat: number, lon: number}> = {
      'London': { lat: 51.5074, lon: -0.1278 },
      'Istanbul': { lat: 41.0082, lon: 28.9784 },
      'New York': { lat: 40.7128, lon: -74.0060 },
      'Los Angeles': { lat: 34.0522, lon: -118.2437 },
      'Paris': { lat: 48.8566, lon: 2.3522 },
      'Berlin': { lat: 52.5200, lon: 13.4050 },
    };
    
    return coords[location] || null;
  }
}
