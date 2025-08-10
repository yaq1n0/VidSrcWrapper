import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import type { Movie, APIError } from '@vidsrc-wrapper/data';
import { TMDBService } from './services/tmdb.js';
import { CONFIG } from './config.js';

const app = new Hono();
const tmdbService = new TMDBService();

// CORS configuration
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// Health check endpoint
app.get('/', c => {
  return c.json({ message: 'TMDB Search API Server', status: 'healthy' });
});

// Movie search endpoint
app.get('/api/movies', async c => {
  try {
    const query = c.req.query('query');
    const page = parseInt(c.req.query('page') || '1');

    if (!query) {
      const error: APIError = {
        error: 'Missing query parameter',
        message: 'Please provide a search query',
      };
      return c.json(error, 400);
    }

    if (page < 1 || page > 1000) {
      const error: APIError = {
        error: 'Invalid page parameter',
        message: 'Page must be between 1 and 1000',
      };
      return c.json(error, 400);
    }

    const searchResponse = await tmdbService.searchMovies(query, page);

    // Return just the movies array as requested
    const movies: Movie[] = searchResponse.results;
    return c.json(movies);
  } catch (error) {
    console.error('Error in /api/movies:', error);
    const apiError: APIError = {
      error: 'Internal server error',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
    return c.json(apiError, 500);
  }
});

// Start server
const port = CONFIG.PORT;
console.log(`🚀 Server starting on port ${port}`);
console.log(`📡 TMDB API key configured: ${CONFIG.TMDB_API_KEY ? '✅' : '❌'}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`🌟 Server running at http://localhost:${port}`);
console.log(
  `🔍 Search endpoint: http://localhost:${port}/api/movies?query=batman`
);
