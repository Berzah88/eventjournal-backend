import express from 'express';
import cors from 'cors';
import { DuckDuckGoScraper } from './scrapers/duckduckgo';
import { CacheManager } from './services/cache';

const app = express();
const PORT = process.env.PORT || 3000;

// Services
const scraper = new DuckDuckGoScraper();
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
    
    // Cache key oluştur
    const cacheKey = cache.generateKey('search', q as string, location as string);
    
    // Cache'den al veya scrape et
    const events = await cache.getOrFetch(
      cacheKey,
      async () => {
        console.log(`🕷️ Scraping DuckDuckGo...`);
        return await scraper.search(q as string, location as string);
      },
      14400 // 4 saat cache
    );
    
    console.log(`✅ Returning ${events.length} events`);
    
    res.json({ 
      events,
      total: events.length,
      cached: cacheKey,
      query: q,
      location,
    });
  } catch (error: any) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
