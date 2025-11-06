import { Router, Request, Response } from 'express';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

// Mock events generator - Tamamen ücretsiz!
function generateMockEvents(location: string): any[] {
  const now = new Date();
  const cities: { [key: string]: { region: string; country: string; lat: number; lng: number } } = {
    'London': { region: 'England', country: 'GB', lat: 51.5074, lng: -0.1278 },
    'New York': { region: 'NY', country: 'US', lat: 40.7128, lng: -74.0060 },
    'Paris': { region: 'Île-de-France', country: 'FR', lat: 48.8566, lng: 2.3522 },
    'Tokyo': { region: 'Kanto', country: 'JP', lat: 35.6762, lng: 139.6503 },
    'Sydney': { region: 'NSW', country: 'AU', lat: -33.8688, lng: 151.2093 },
    'Istanbul': { region: 'Marmara', country: 'TR', lat: 41.0082, lng: 28.9784 },
  };

  const cityInfo = cities[location] || cities['London'];

  const mockEvents = [
    {
      id: '1',
      title: 'Coldplay - Music of the Spheres World Tour',
      description: 'Experience the magic of Coldplay live in concert. A spectacular show featuring hits from their entire career.',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://www.coldplay.com',
      imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
      venue: {
        name: 'Wembley Stadium',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat,
        longitude: cityInfo.lng,
      },
      category: 'Music',
      isOnline: false,
    },
    {
      id: '2',
      title: 'Taylor Swift - The Eras Tour',
      description: 'A journey through Taylor Swift\'s musical eras. An unforgettable night of music and memories.',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://www.taylorswift.com',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
      venue: {
        name: 'The O2 Arena',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat + 0.01,
        longitude: cityInfo.lng + 0.01,
      },
      category: 'Music',
      isOnline: false,
    },
    {
      id: '3',
      title: 'Tech Innovation Summit 2025',
      description: 'Annual technology and innovation conference featuring industry leaders and cutting-edge demos.',
      startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://example.com/tech-summit',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
      venue: {
        name: 'Convention Center',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat - 0.01,
        longitude: cityInfo.lng - 0.01,
      },
      category: 'Technology',
      isOnline: false,
    },
    {
      id: '4',
      title: 'International Food & Wine Festival',
      description: 'Discover culinary delights from around the world. Meet renowned chefs and taste exclusive dishes.',
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://example.com/food-festival',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      venue: {
        name: 'City Park',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat + 0.02,
        longitude: cityInfo.lng - 0.02,
      },
      category: 'Food & Drink',
      isOnline: false,
    },
    {
      id: '5',
      title: 'Champions League Final',
      description: 'The pinnacle of European club football. Witness history in the making.',
      startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://www.uefa.com',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop',
      venue: {
        name: 'National Stadium',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat - 0.02,
        longitude: cityInfo.lng + 0.02,
      },
      category: 'Sports',
      isOnline: false,
    },
    {
      id: '6',
      title: 'Summer Jazz Festival',
      description: 'Three days of world-class jazz performances under the stars.',
      startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 47 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://example.com/jazz-fest',
      imageUrl: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&h=600&fit=crop',
      venue: {
        name: 'Riverside Amphitheater',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat + 0.03,
        longitude: cityInfo.lng + 0.03,
      },
      category: 'Music',
      isOnline: false,
    },
    {
      id: '7',
      title: 'Art Exhibition: Modern Masters',
      description: 'Featuring works from contemporary artists from around the globe.',
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://example.com/art-exhibit',
      imageUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&h=600&fit=crop',
      venue: {
        name: 'City Art Gallery',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat - 0.03,
        longitude: cityInfo.lng - 0.03,
      },
      category: 'Arts',
      isOnline: false,
    },
    {
      id: '8',
      title: 'Comedy Night Live',
      description: 'Stand-up comedy featuring the hottest comedians of the year.',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      timezone: 'GMT',
      url: 'https://example.com/comedy-night',
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=600&fit=crop',
      venue: {
        name: 'Comedy Club Central',
        city: location,
        region: cityInfo.region,
        country: cityInfo.country,
        latitude: cityInfo.lat + 0.015,
        longitude: cityInfo.lng - 0.015,
      },
      category: 'Comedy',
      isOnline: false,
    },
  ];

  return mockEvents;
}

// GET /api/events - Get events
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      location = 'London',
      categories,
      startDate,
      page = '1',
    } = req.query;

    // Check cache
    const cacheKey = `events_${location}_${categories}_${startDate}_${page}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Returning cached data for:', location);
      return res.json(cachedData);
    }

    console.log(`🎫 Generating mock events for: ${location}`);

    const events = generateMockEvents(location as string);

    const result = {
      events,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: 1,
        totalEvents: events.length,
      },
    };

    // Cache the result
    cache.set(cacheKey, result);

    res.json(result);
  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message,
    });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check cache
    const cacheKey = `event_${id}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Generate mock events and find by ID
    const events = generateMockEvents('London');
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    cache.set(cacheKey, event);
    res.json(event);
  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch event',
      message: error.message,
    });
  }
});

export default router;
