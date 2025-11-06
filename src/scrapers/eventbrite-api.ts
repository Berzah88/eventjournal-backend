import axios from 'axios';
import { Event } from '../types';

/**
 * Eventbrite API v3
 * OAuth not required for public events
 * Free tier: Unlimited public event access
 * Sign up: https://www.eventbrite.com/platform/api
 */
export class EventbriteAPI {
  private readonly API_KEY = process.env.EVENTBRITE_TOKEN || '';
  private readonly BASE_URL = 'https://www.eventbriteapi.com/v3';
  
  async search(query: string, location: string = 'London'): Promise<Event[]> {
    if (!this.API_KEY) {
      console.log('⚠️ EVENTBRITE_TOKEN not set');
      return [];
    }
    
    try {
      console.log(`🎫 Eventbrite API: ${query} in ${location}`);
      
      // Location'ı geocode ile çevir
      const locationData = await this.geocodeLocation(location);
      
      const response = await axios.get(`${this.BASE_URL}/events/search/`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        params: {
          q: query,
          'location.address': location,
          'location.within': '50km',
          'location.latitude': locationData?.latitude,
          'location.longitude': locationData?.longitude,
          expand: 'venue,organizer,category',
          'sort_by': 'date',
        },
        timeout: 10000,
      });
      
      const events: Event[] = [];
      const items = response.data.events || [];
      
      items.forEach((item: any) => {
        const venue = item.venue;
        
        const event: Event = {
          id: `eventbrite-${item.id}`,
          title: item.name.text,
          description: item.description?.text || item.summary || '',
          startDate: item.start.utc,
          endDate: item.end.utc,
          timezone: item.start.timezone,
          url: item.url,
          imageUrl: item.logo?.url || this.getCategoryImage(item.category?.name),
          venue: {
            name: venue?.name || 'Online Event',
            city: venue?.address?.city || location,
            region: venue?.address?.region || '',
            country: venue?.address?.country || '',
            latitude: parseFloat(venue?.latitude) || 0,
            longitude: parseFloat(venue?.longitude) || 0,
          },
          category: this.mapCategory(item.category?.name || query),
          isOnline: item.online_event || !venue,
          source: 'eventbrite',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ Eventbrite: ${events.length} events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ Eventbrite API error:', error.response?.data || error.message);
      return [];
    }
  }
  
  private async geocodeLocation(location: string): Promise<{latitude: number, longitude: number} | null> {
    // Basit city mapping (daha sonra geocoding API eklenebilir)
    const cityCoords: Record<string, {latitude: number, longitude: number}> = {
      'London': { latitude: 51.5074, longitude: -0.1278 },
      'Istanbul': { latitude: 41.0082, longitude: 28.9784 },
      'New York': { latitude: 40.7128, longitude: -74.0060 },
      'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
      'Paris': { latitude: 48.8566, longitude: 2.3522 },
      'Berlin': { latitude: 52.5200, longitude: 13.4050 },
    };
    
    return cityCoords[location] || null;
  }
  
  private mapCategory(categoryName: string): string {
    const cat = categoryName?.toLowerCase() || '';
    
    if (cat.includes('music')) return 'Music';
    if (cat.includes('sports') || cat.includes('fitness')) return 'Sports';
    if (cat.includes('performing') || cat.includes('visual')) return 'Arts';
    if (cat.includes('film') || cat.includes('media')) return 'Film';
    if (cat.includes('food') || cat.includes('drink')) return 'Food & Drink';
    if (cat.includes('business') || cat.includes('tech')) return 'Technology';
    if (cat.includes('health')) return 'Health';
    if (cat.includes('community')) return 'Community';
    
    return 'Entertainment';
  }
  
  private getCategoryImage(category: string): string {
    const cat = this.mapCategory(category);
    
    const imageMap: Record<string, string> = {
      'Music': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
      'Arts': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
      'Film': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
      'Food & Drink': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'Technology': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
    };
    
    return imageMap[cat] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }
}
