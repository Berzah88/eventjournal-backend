import express from 'express';
import cors from 'cors';
import { EventbriteAPI } from './scrapers/eventbrite-api';
import { DuckDuckGoScraper } from './scrapers/duckduckgo';
import { CacheManager } from './services/cache';
import { Event } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Services
const eventbrite = new EventbriteAPI();
const duckduckgo = new DuckDuckGoScraper();
const cache = new CacheManager();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => { 
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: cache.getStats(),
  }); 
});

app.get('/api/events/search', async (req, res) => { 
  try {
    const { q, location = 'London' } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    console.log(`🔍 Searching: ${q} in ${location}`);
    
    const cacheKey = cache.generateKey('search', q, location);
    
    const events = await cache.getOrFetch<Event[]>(cacheKey, async () => {
      console.log('❌ Cache MISS:', cacheKey);
      console.log('🕷️ Fetching from multiple sources...');
      
      // API'lardan paralel veri çek
      const [eventbriteEvents, duckduckgoEvents] = await Promise.all([
        eventbrite.search(q as string, location as string).catch((err: any) => {
          console.log('Eventbrite failed:', err.message);
          return [];
        }),
        duckduckgo.search(q as string, location as string).catch((err: any) => {
          console.log('DuckDuckGo failed:', err.message);
          return [];
        }),
      ]);
      
      // Tüm sonuçları birleştir
      const allEvents = [...eventbriteEvents, ...duckduckgoEvents];
      
      // Duplicate'leri kaldır (aynı başlık + tarih)
      const uniqueEvents = allEvents.reduce((acc, event) => {
        const key = `${event.title.toLowerCase().trim()}-${event.startDate.split('T')[0]}`;
        if (!acc.has(key)) {
          acc.set(key, event);
        }
        return acc;
      }, new Map<string, Event>());
      
      const results = Array.from(uniqueEvents.values());
      
      console.log(`✅ Total: ${results.length} events (Eventbrite: ${eventbriteEvents.length}, DuckDuckGo: ${duckduckgoEvents.length})`);
      return results;
    }, 14400); // 4 saat cache
    
    console.log(`✅ Returning ${events.length} events`);
    
    res.json({ 
      events, 
      total: events.length,
      cached: cacheKey,
      query: q,
      location,
    });
  } catch (error: any) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Failed to search events', message: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
