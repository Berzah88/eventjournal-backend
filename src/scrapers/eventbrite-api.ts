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
    // Eventbrite public events - OAuth gerekmez
    try {
      console.log(`🎫 Eventbrite Public Search: ${query} in ${location}`);
      
      // Public web scraping endpoint (OAuth gerektirmez)
      const searchUrl = `https://www.eventbrite.com/d/${location.toLowerCase().replace(/\s+/g, '-')}/${query.toLowerCase().replace(/\s+/g, '-')}/`;
      
      console.log(`📍 Searching URL: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
        timeout: 15000,
      });
      
      // HTML'den JSON parse et (Eventbrite sayfalarında __SERVER_DATA__ var)
      const html = response.data;
      const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
      
      if (!jsonMatch) {
        console.log('⚠️ Could not find event data in page');
        return [];
      }
      
      const pageData = JSON.parse(jsonMatch[1]);
      const events: Event[] = [];
      
      // Event verilerini parse et
      const eventList = pageData?.props?.pageProps?.searchData?.events?.results || [];
      
      eventList.forEach((item: any) => {
        const event: Event = {
          id: `eventbrite-${item.id}`,
          title: item.name,
          description: item.summary || '',
          startDate: item.start_date || new Date().toISOString(),
          endDate: item.end_date || item.start_date || new Date().toISOString(),
          timezone: 'UTC',
          url: item.url || `https://www.eventbrite.com/e/${item.id}`,
          imageUrl: item.image?.url || this.getCategoryImage(query),
          venue: {
            name: item.primary_venue?.name || 'Online Event',
            city: item.primary_venue?.address?.city || location,
            region: item.primary_venue?.address?.region || '',
            country: item.primary_venue?.address?.country || '',
            latitude: 0,
            longitude: 0,
          },
          category: this.mapCategory(query),
          isOnline: item.is_online_event || false,
          source: 'eventbrite',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ Eventbrite: ${events.length} events found`);
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
