import axios from 'axios';
import { Event } from '../types';

/**
 * PredictHQ Events API
 * Free tier: 1000 requests/month, 50 events per request
 * Sign up: https://www.predicthq.com/
 */
export class PredictHQAPI {
  private readonly API_KEY = process.env.PREDICTHQ_API_KEY || '';
  private readonly BASE_URL = 'https://api.predicthq.com/v1';
  
  async search(query: string, location: string = 'London'): Promise<Event[]> {
    if (!this.API_KEY) {
      console.log('⚠️ PREDICTHQ_API_KEY not set');
      return [];
    }
    
    try {
      console.log(`🔮 PredictHQ API: ${query} in ${location}`);
      
      const response = await axios.get(`${this.BASE_URL}/events/`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Accept': 'application/json',
        },
        params: {
          q: query,
          'place.scope': location,
          limit: 50,
          sort: 'start',
        },
        timeout: 10000,
      });
      
      const events: Event[] = [];
      const results = response.data.results || [];
      
      results.forEach((item: any) => {
        const event: Event = {
          id: `predicthq-${item.id}`,
          title: item.title,
          description: item.description || `${item.title} in ${location}`,
          startDate: item.start || new Date().toISOString(),
          endDate: item.end || item.start || new Date().toISOString(),
          timezone: item.timezone || 'UTC',
          url: item.entities?.[0]?.formatted_address || '',
          imageUrl: this.getCategoryImage(item.category),
          venue: {
            name: item.entities?.[0]?.name || 'Venue TBA',
            city: location,
            region: '',
            country: item.country || '',
            latitude: item.location?.[1] || 0,
            longitude: item.location?.[0] || 0,
          },
          category: this.mapCategory(item.category, item.labels),
          isOnline: item.phq_attendance === 0,
          source: 'predicthq',
          scrapedAt: new Date().toISOString(),
        };
        
        events.push(event);
      });
      
      console.log(`✅ PredictHQ: ${events.length} events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ PredictHQ API error:', error.response?.data || error.message);
      return [];
    }
  }
  
  private mapCategory(category: string, labels: string[] = []): string {
    const cat = category?.toLowerCase() || '';
    const labelStr = labels.join(' ').toLowerCase();
    
    if (cat.includes('concerts') || cat.includes('music') || labelStr.includes('concert')) return 'Music';
    if (cat.includes('sports')) return 'Sports';
    if (cat.includes('performing-arts') || cat.includes('theatre')) return 'Theatre';
    if (cat.includes('conferences')) return 'Technology';
    if (cat.includes('festivals')) return 'Music';
    if (cat.includes('community')) return 'Entertainment';
    
    return 'Entertainment';
  }
  
  private getCategoryImage(category: string): string {
    const cat = category?.toLowerCase() || '';
    
    if (cat.includes('concerts') || cat.includes('music')) {
      return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop';
    }
    if (cat.includes('sports')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop';
    }
    if (cat.includes('performing-arts')) {
      return 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop';
    }
    
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }
}
