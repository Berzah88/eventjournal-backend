import axios from 'axios';
import { Event } from '../types';

/**
 * Ticketmaster Discovery API
 * Free tier: 5000 requests/day
 * Sign up: https://developer.ticketmaster.com/
 */
export class TicketmasterAPI {
  private readonly API_KEY = process.env.TICKETMASTER_API_KEY || '';
  private readonly BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
  
  async search(query: string, location: string = 'London'): Promise<Event[]> {
    if (!this.API_KEY) {
      console.log('⚠️ TICKETMASTER_API_KEY not set');
      return [];
    }
    
    try {
      console.log(`🎫 Ticketmaster API: ${query} in ${location}`);
      
      // Location mapping (city -> country code)
      const cityToCountry: Record<string, string> = {
        'London': 'GB',
        'Istanbul': 'TR',
        'New York': 'US',
        'Los Angeles': 'US',
        'Paris': 'FR',
        'Berlin': 'DE',
        'Tokyo': 'JP',
      };
      
      const countryCode = cityToCountry[location] || 'GB';
      
      const response = await axios.get(`${this.BASE_URL}/events.json`, {
        params: {
          apikey: this.API_KEY,
          keyword: query,
          city: location,
          countryCode,
          size: 50, // Max 50 per request
          sort: 'date,asc',
        },
        timeout: 10000,
      });
      
      const events: Event[] = [];
      const items = response.data._embedded?.events || [];
      
      items.forEach((item: any) => {
        const venue = item._embedded?.venues?.[0];
        const image = item.images?.find((img: any) => img.width > 500) || item.images?.[0];
        
        const event: Event = {
          id: `ticketmaster-${item.id}`,
          title: item.name,
          description: item.info || item.pleaseNote || `${item.name} in ${location}`,
          startDate: item.dates?.start?.dateTime || item.dates?.start?.localDate || new Date().toISOString(),
          endDate: item.dates?.end?.dateTime || item.dates?.start?.dateTime || item.dates?.start?.localDate || new Date().toISOString(),
          timezone: item.dates?.timezone || 'UTC',
          url: item.url,
          imageUrl: image?.url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
          venue: {
            name: venue?.name || 'Venue TBA',
            city: venue?.city?.name || location,
            region: venue?.state?.name || '',
            country: venue?.country?.name || '',
            latitude: parseFloat(venue?.location?.latitude) || 0,
            longitude: parseFloat(venue?.location?.longitude) || 0,
          },
          category: this.mapCategory(item.classifications?.[0]),
          isOnline: false,
          source: 'ticketmaster',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ Ticketmaster: ${events.length} events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ Ticketmaster API error:', error.response?.data || error.message);
      return [];
    }
  }
  
  private mapCategory(classification: any): string {
    if (!classification) return 'Entertainment';
    
    const segment = classification.segment?.name?.toLowerCase() || '';
    const genre = classification.genre?.name?.toLowerCase() || '';
    
    if (segment.includes('music') || genre.includes('music')) return 'Music';
    if (segment.includes('sports') || genre.includes('sports')) return 'Sports';
    if (segment.includes('arts') || segment.includes('theatre')) return 'Theatre';
    if (segment.includes('film')) return 'Film';
    if (segment.includes('miscellaneous')) return 'Entertainment';
    
    return 'Entertainment';
  }
}
