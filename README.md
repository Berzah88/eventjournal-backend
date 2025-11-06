# Event Journal Backend

Backend API for Event Journal mobile app. Provides event data from Eventbrite API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Get your Eventbrite API token:
   - Go to https://www.eventbrite.com/platform/
   - Create an account (free)
   - Generate an OAuth token
   - Copy token to `.env` file

4. Run development server:
```bash
npm run dev
```

Server will start on http://localhost:3000

## API Endpoints

### GET /api/events
Search for events

**Query Parameters:**
- `location` - City name (default: "New York")
- `categories` - Event category IDs (comma-separated)
- `startDate` - ISO date string (e.g., "2025-12-01T00:00:00Z")
- `page` - Page number (default: 1)

**Example:**
```
GET /api/events?location=London&categories=103&page=1
```

**Response:**
```json
{
  "events": [
    {
      "id": "123",
      "title": "Coldplay Concert",
      "description": "...",
      "startDate": "2025-12-15T19:00:00",
      "endDate": "2025-12-15T23:00:00",
      "timezone": "Europe/London",
      "url": "https://eventbrite.com/...",
      "imageUrl": "https://...",
      "venue": {
        "name": "Wembley Stadium",
        "city": "London",
        "region": "England",
        "country": "GB",
        "latitude": 51.5,
        "longitude": -0.1
      },
      "category": "Music",
      "isOnline": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalEvents": 250
  }
}
```

### GET /api/events/:id
Get event details by ID

**Example:**
```
GET /api/events/123456789
```

## Event Categories

Common Eventbrite category IDs:
- 103 - Music
- 105 - Performing & Visual Arts
- 108 - Sports & Fitness
- 110 - Food & Drink
- 113 - Business & Professional
- 115 - Film, Media & Entertainment

## Caching

API responses are cached for 1 hour to reduce API calls and improve performance.

## Development

```bash
npm run dev      # Development with hot reload
npm run build    # Build for production
npm start        # Run production build
```
