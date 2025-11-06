import axios from 'axios';
import * as cheerio from 'cheerio';
import { Event } from '../types';

/**
 * Eventbrite public scraper - Gerçek event verileri
 */
export class EventbriteScraper {
  private readonly BASE_URL = 'https://www.eventbrite.com';
  
  async search(query: string, location: string = 'London'): Promise<Event[]> {
    try {
      console.log(`🎫 Scraping Eventbrite for: ${query} in ${location}`);
      
      const searchUrl = `${this.BASE_URL}/d/${location.toLowerCase()}--united-kingdom/${query.toLowerCase()}/`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 15000,
      });
      
      const $ = cheerio.load(response.data);
      const events: Event[] = [];
      
      // Eventbrite event cards
      $('[data-event-id]').each((i, elem) => {
        if (i >= 15) return false;
        
        try {
          const title = $(elem).find('[data-testid="event-card__title"]').text().trim();
          const dateText = $(elem).find('[data-testid="event-card__date"]').text().trim();
          const venue = $(elem).find('[data-testid="event-card__venue"]').text().trim();
          const eventUrl = $(elem).find('a').attr('href') || '';
          const imageUrl = $(elem).find('img').attr('src') || this.getDefaultImage(query);
          
          if (!title) return;
          
          const event: Event = {
            id: `eventbrite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            description: `Event in ${location}`,
            startDate: this.parseDate(dateText),
            endDate: this.parseDate(dateText),
            timezone: 'UTC',
            url: eventUrl.startsWith('http') ? eventUrl : `${this.BASE_URL}${eventUrl}`,
            imageUrl,
            venue: {
              name: venue || 'Venue TBA',
              city: location,
              region: '',
              country: '',
              latitude: 0,
              longitude: 0,
            },
            category: this.detectCategory(query + ' ' + title),
            isOnline: venue.toLowerCase().includes('online') || venue.toLowerCase().includes('virtual'),
            source: 'eventbrite',
            scrapedAt: new Date().toISOString(),
          };
          
          events.push(event);
        } catch (error) {
          console.error('Error parsing Eventbrite event:', error);
        }
      });
      
      console.log(`✅ Found ${events.length} Eventbrite events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ Eventbrite scraping error:', error.message);
      return [];
    }
  }
  
  private parseDate(dateText: string): string {
    try {
      // "Sat, Dec 14, 9:00 PM" gibi formatları parse et
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {}
    
    // Parse başarısız, 7 gün sonra kullan
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  private detectCategory(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.match(/theatre|theater|play|drama|musical|west end|broadway/)) return 'Theatre';
    if (lower.match(/concert|music|band|singer|dj|gig|tour|album/)) return 'Music';
    if (lower.match(/sport|game|match|championship|league|tournament|football|basketball/)) return 'Sports';
    if (lower.match(/exhibition|art|gallery|museum|painting|sculpture/)) return 'Arts';
    if (lower.match(/film|movie|cinema|screening|premiere/)) return 'Film';
    if (lower.match(/food|restaurant|culinary|tasting|chef/)) return 'Food & Drink';
    if (lower.match(/tech|conference|workshop|seminar|meetup/)) return 'Technology';
    
    return 'Entertainment';
  }
  
  private getDefaultImage(query: string): string {
    const category = this.detectCategory(query);
    const imageMap: Record<string, string> = {
      'Music': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
      'Theatre': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
      'Arts': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
      'Film': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
      'Food & Drink': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'Technology': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
    };
    
    return imageMap[category] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }
}
