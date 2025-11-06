import axios from 'axios';
import { Event } from '../types';

/**
 * SerpAPI ile Google Events scraping
 * Free tier: 100 request/month
 */
export class SerpAPIEvents {
  private readonly API_KEY = process.env.SERPAPI_KEY || '';
  private readonly BASE_URL = 'https://serpapi.com/search';
  
  async search(query: string, location: string = 'London'): Promise<Event[]> {
    if (!this.API_KEY) {
      console.log('⚠️ SERPAPI_KEY not configured, skipping SerpAPI');
      return [];
    }
    
    try {
      console.log(`🔍 SerpAPI searching: ${query} events in ${location}`);
      
      const response = await axios.get(this.BASE_URL, {
        params: {
          engine: 'google_events',
          q: `${query} events in ${location}`,
          api_key: this.API_KEY,
          hl: 'en',
        },
        timeout: 10000,
      });
      
      const events: Event[] = [];
      const results = response.data.events_results || [];
      
      results.forEach((item: any) => {
        const event: Event = {
          id: `serpapi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title || 'Event',
          description: item.description || item.snippet || '',
          startDate: this.parseDate(item.date?.start_date),
          endDate: this.parseDate(item.date?.end_date || item.date?.start_date),
          timezone: 'UTC',
          url: item.link || '',
          imageUrl: item.thumbnail || this.getDefaultImage(),
          venue: {
            name: item.venue?.name || 'Venue TBA',
            city: location,
            region: '',
            country: '',
            latitude: 0,
            longitude: 0,
          },
          category: this.detectCategory(query + ' ' + item.title),
          isOnline: false,
          source: 'serpapi',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ Found ${events.length} SerpAPI events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ SerpAPI error:', error.message);
      return [];
    }
  }
  
  private parseDate(dateStr?: string): string {
    if (!dateStr) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }
  
  private detectCategory(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.match(/theatre|theater|play|drama|musical/)) return 'Theatre';
    if (lower.match(/concert|music|band|singer|dj|festival/)) return 'Music';
    if (lower.match(/sport|game|match|championship/)) return 'Sports';
    if (lower.match(/exhibition|art|gallery|museum/)) return 'Arts';
    if (lower.match(/film|movie|cinema|screening/)) return 'Film';
    if (lower.match(/food|restaurant|culinary/)) return 'Food & Drink';
    if (lower.match(/tech|conference|workshop/)) return 'Technology';
    
    return 'Entertainment';
  }
  
  private getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }
}
