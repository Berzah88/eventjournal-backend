import axios from 'axios';
import * as cheerio from 'cheerio';
import { Event } from '../types';

/**
 * Songkick scraper - Gerçek konser verileri
 */
export class SongkickScraper {
  private readonly BASE_URL = 'https://www.songkick.com';
  
  async search(location: string = 'London'): Promise<Event[]> {
    try {
      console.log(`🎵 Scraping Songkick for: ${location}`);
      
      // Songkick metro area URLs
      const locationMap: Record<string, string> = {
        'London': '/metro-areas/24426-uk-london',
        'Istanbul': '/metro-areas/32463-turkey-istanbul',
        'New York': '/metro-areas/7644-us-new-york',
        'Los Angeles': '/metro-areas/17835-us-los-angeles',
        'Paris': '/metro-areas/28909-france-paris',
        'Berlin': '/metro-areas/28443-germany-berlin',
      };
      
      const locationPath = locationMap[location] || locationMap['London'];
      const url = `${this.BASE_URL}${locationPath}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 15000,
      });
      
      const $ = cheerio.load(response.data);
      const events: Event[] = [];
      
      // Songkick event cards parse et
      $('.event-listings li.event').each((i, elem) => {
        if (i >= 20) return false;
        
        try {
          const title = $(elem).find('.event-link strong').first().text().trim();
          const artists = $(elem).find('.event-link .artists').text().trim();
          const venue = $(elem).find('.venue-name').text().trim();
          const dateText = $(elem).find('time').attr('datetime') || '';
          const eventUrl = $(elem).find('.event-link').attr('href') || '';
          
          if (!title || !dateText) return;
          
          const event: Event = {
            id: `songkick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: artists || title,
            description: `Concert at ${venue}`,
            startDate: new Date(dateText).toISOString(),
            endDate: new Date(dateText).toISOString(),
            timezone: 'UTC',
            url: eventUrl.startsWith('http') ? eventUrl : `${this.BASE_URL}${eventUrl}`,
            imageUrl: this.getDefaultImage(),
            venue: {
              name: venue || 'Venue TBA',
              city: location,
              region: '',
              country: '',
              latitude: 0,
              longitude: 0,
            },
            category: 'Music',
            isOnline: false,
            source: 'songkick',
            scrapedAt: new Date().toISOString(),
          };
          
          events.push(event);
        } catch (error) {
          console.error('Error parsing Songkick event:', error);
        }
      });
      
      console.log(`✅ Found ${events.length} Songkick events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ Songkick scraping error:', error.message);
      return [];
    }
  }
  
  private getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop';
  }
}
