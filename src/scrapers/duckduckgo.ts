import axios from 'axios';
import * as cheerio from 'cheerio';
import { Event } from '../types';

export class DuckDuckGoScraper {
  private readonly BASE_URL = 'https://html.duckduckgo.com/html/';
  
  /**
   * DuckDuckGo ile etkinlik ara
   */
  async search(query: string, location: string): Promise<Event[]> {
    try {
      const fullQuery = `${query} events in ${location} 2025`;
      console.log(`🔍 DuckDuckGo searching: ${fullQuery}`);
      
      // DuckDuckGo HTML arama
      const response = await axios.post(
        this.BASE_URL,
        new URLSearchParams({ q: fullQuery }),
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 10000,
        }
      );
      
      const $ = cheerio.load(response.data);
      const events: Event[] = [];
      
      // Arama sonuçlarını parse et
      $('.result').each((i, elem) => {
        if (i >= 20) return false; // İlk 20 sonuç yeterli
        
        const title = $(elem).find('.result__a').text().trim();
        const url = $(elem).find('.result__a').attr('href') || '';
        const snippet = $(elem).find('.result__snippet').text().trim();
        
        // Etkinlik olup olmadığını kontrol et
        if (this.isEventResult(title, snippet)) {
          const event = this.extractEventFromSnippet(title, snippet, url, location, query);
          if (event) {
            events.push(event);
          }
        }
      });
      
      console.log(`✅ Found ${events.length} potential events`);
      return events;
      
    } catch (error: any) {
      console.error('❌ DuckDuckGo scraping error:', error.message);
      return [];
    }
  }
  
  /**
   * Sonucun etkinlik olup olmadığını kontrol et
   */
  private isEventResult(title: string, snippet: string): boolean {
    const eventKeywords = [
      'concert', 'festival', 'show', 'performance', 'live',
      'exhibition', 'match', 'game', 'theatre', 'theater',
      'event', 'happening', 'gig', 'tour', 'comedy',
      'screening', 'premiere', 'opening', 'conference'
    ];
    
    const text = (title + ' ' + snippet).toLowerCase();
    return eventKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Snippet'ten etkinlik bilgisi çıkar
   */
  private extractEventFromSnippet(
    title: string,
    snippet: string,
    url: string,
    location: string,
    query: string
  ): Event | null {
    try {
      // Tarih çıkar (farklı formatlar)
      const datePatterns = [
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})/i,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{2})-(\d{2})/,
      ];
      
      let dateMatch = null;
      for (const pattern of datePatterns) {
        dateMatch = snippet.match(pattern);
        if (dateMatch) break;
      }
      
      // Mekan çıkar
      const venuePatterns = [
        /at\s+([A-Z][a-zA-Z\s&'-]+)(?:,|\.|in|$)/,
        /venue:\s*([A-Z][a-zA-Z\s&'-]+)/i,
        /location:\s*([A-Z][a-zA-Z\s&'-]+)/i,
      ];
      
      let venueMatch = null;
      for (const pattern of venuePatterns) {
        venueMatch = snippet.match(pattern);
        if (venueMatch) break;
      }
      
      const now = new Date();
      const startDate = dateMatch 
        ? this.parseDate(dateMatch[0])
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 gün sonra default
      
      return {
        id: `ddg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: this.cleanTitle(title),
        description: snippet.substring(0, 500),
        startDate,
        endDate: startDate,
        timezone: 'UTC',
        url: url,
        imageUrl: this.getDefaultImage(title),
        venue: {
          name: venueMatch?.[1]?.trim() || 'Venue TBA',
          city: location,
          region: '',
          country: '',
          latitude: 0,
          longitude: 0,
        },
        category: this.detectCategory(query + ' ' + title + ' ' + snippet),
        isOnline: snippet.toLowerCase().includes('online') || snippet.toLowerCase().includes('virtual'),
        source: 'duckduckgo',
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error extracting event:', error);
      return null;
    }
  }
  
  /**
   * Tarih string'ini ISO formatına çevir
   */
  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Parse başarısız, 7 gün sonrasını kullan
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }
  
  /**
   * Başlığı temizle
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/[|›»]\s*.*/g, '')
      .trim();
  }
  
  /**
   * Kategori algıla
   */
  private detectCategory(text: string): string {
    const lower = text.toLowerCase();
    
    // Daha spesifik olanlar önce (theatre "show" kelimesi içerdiği için music'ten önce kontrol et)
    if (lower.match(/theatre|theater|play|drama|musical|west end|broadway/)) return 'Theatre';
    if (lower.match(/concert|music|band|singer|dj|gig|tour|album/)) return 'Music';
    if (lower.match(/sport|game|match|championship|league|tournament|football|basketball/)) return 'Sports';
    if (lower.match(/exhibition|art|gallery|museum|painting|sculpture/)) return 'Arts';
    if (lower.match(/film|movie|cinema|screening|premiere/)) return 'Film';
    if (lower.match(/food|restaurant|culinary|tasting|chef/)) return 'Food & Drink';
    if (lower.match(/tech|conference|summit|workshop|seminar/)) return 'Technology';
    
    return 'Entertainment';
  }
  
  /**
   * Kategori için default görsel
   */
  private getDefaultImage(title: string): string {
    const category = this.detectCategory(title);
    const images: Record<string, string> = {
      'Music': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
      'Theatre': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=600&fit=crop',
      'Arts': 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&h=600&fit=crop',
      'Film': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
      'Food & Drink': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      'Technology': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    };
    
    return images[category] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }
}
