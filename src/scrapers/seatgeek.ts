import axios from 'axios';
import { Event } from '../types';

/**
 * SeatGeek API
 * Free tier: No OAuth required, just client ID
 * Sign up: https://platform.seatgeek.com/
 */
export class SeatGeekAPI {
  private readonly CLIENT_ID = process.env.SEATGEEK_CLIENT_ID || '';
  private readonly BASE_URL = 'https://api.seatgeek.com/2';
  
  async search(query: string, location: string = 'London'): Promise<Event[]> {
    if (!this.CLIENT_ID) {
      console.log('⚠️ SEATGEEK_CLIENT_ID not set');
      return [];
    }
    
    try {
      console.log(`🎟️ SeatGeek API: ${query} in ${location}`);
      
      const response = await axios.get(`${this.BASE_URL}/events`, {
        params: {
          client_id: this.CLIENT_ID,
          q: query,
          'venue.city': location,
          per_page: 50,
          sort: 'datetime_utc.asc',
        },
        timeout: 10000,
      });
      
      const events: Event[] = [];
      const items = response.data.events || [];
      
      items.forEach((item: any) => {
        const venue = item.venue;
        
        const event: Event = {
          id: `seatgeek-${item.id}`,
          title: item.title || item.short_title,
          description: `${item.type} at ${venue.name}`,
          startDate: item.datetime_utc,
          endDate: item.datetime_utc,
          timezone: venue.timezone || 'UTC',
          url: item.url,
          imageUrl: item.performers?.[0]?.image || this.getCategoryImage(item.type),
          venue: {
            name: venue.name,
            city: venue.city,
            region: venue.state || '',
            country: venue.country,
            latitude: parseFloat(venue.location?.lat) || 0,
            longitude: parseFloat(venue.location?.lon) || 0,
          },
          category: this.mapCategory(item.type, item.taxonomies),
          isOnline: false,
          source: 'seatgeek',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ SeatGeek: ${events.length} events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ SeatGeek API error:', error.response?.data || error.message);
      return [];
    }
  }
  
  private mapCategory(type: string, taxonomies: any[] = []): string {
    const eventType = type?.toLowerCase() || '';
    
    if (eventType.includes('concert') || eventType.includes('music')) return 'Music';
    if (eventType.includes('sports') || eventType.includes('nfl') || eventType.includes('nba')) return 'Sports';
    if (eventType.includes('theater') || eventType.includes('broadway')) return 'Theatre';
    if (eventType.includes('comedy')) return 'Entertainment';
    
    // Taxonomy'den kategori belirle
    const taxonomy = taxonomies.find(t => t.parent_id === null);
    if (taxonomy) {
      const taxName = taxonomy.name.toLowerCase();
      if (taxName.includes('concert')) return 'Music';
      if (taxName.includes('sports')) return 'Sports';
      if (taxName.includes('theater')) return 'Theatre';
    }
    
    return 'Entertainment';
  }
  
  private getCategoryImage(type: string): string {
    const category = this.mapCategory(type);
    
    const imageMap: Record<string, string> = {
      'Music': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
      'Theatre': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop',
    };
    
    return imageMap[category] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }
}
