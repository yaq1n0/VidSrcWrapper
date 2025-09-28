import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { TMDBService } from './tmdb.js';
import { createHandlers } from './handlers.js';
import { CONFIG } from './config.js';

const app = new Hono();
const tmdbService = new TMDBService();

// CORS configuration
app.use(
  '/*',
  cors({
    origin: ['http://localhost:3000'], // Add your frontend URLs (TODO: I don't think this will work if I deploy this in prod/over internet)
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// Health check endpoint
app.get('/', c =>
  c.json({ message: 'TMDB Search API Server', status: 'healthy' })
);

const handlers = createHandlers(tmdbService);

// Movie search endpoint
app.get('/api/movies', async context => {
  const query = context.req.query('query');
  const page = parseInt(context.req.query('page') || '1');
  const result = await handlers.searchMovies({ query, page });
  context.status(result.status);
  return context.json(result.body);
});

// Movie details endpoint
app.get('/api/movies/:id', async context => {
  const idParam = context.req.param('id');
  const movieId = parseInt(idParam, 10);
  const result = await handlers.getMovieById({ id: movieId });
  context.status(result.status);
  return context.json(result.body);
});

// TV search endpoint
app.get('/api/tv', async context => {
  const query = context.req.query('query');
  const page = parseInt(context.req.query('page') || '1');
  const result = await handlers.searchShows({ query, page });
  context.status(result.status);
  return context.json(result.body);
});

// TV details endpoint
app.get('/api/tv/:id', async context => {
  const idParam = context.req.param('id');
  const showId = parseInt(idParam, 10);
  const result = await handlers.getShowById({ id: showId });
  context.status(result.status);
  return context.json(result.body);
});

// TV season episodes endpoint
app.get('/api/tv/:id/season/:seasonNumber', async context => {
  const idParam = context.req.param('id');
  const seasonParam = context.req.param('seasonNumber');
  const showId = parseInt(idParam, 10);
  const seasonNumber = parseInt(seasonParam, 10);
  const result = await handlers.getSeasonEpisodes({ id: showId, seasonNumber });
  context.status(result.status);
  return context.json(result.body);
});

// Start server
const port = CONFIG.PORT;
console.log(`🚀 Server starting on port ${port}`);
console.log(`📡 TMDB API key configured: ${CONFIG.TMDB_API_KEY ? '✅' : '❌'}`);

serve({ fetch: app.fetch, port });

console.log(`🌟 Server running at http://localhost:${port}`);
console.log(
  `🔍 Movies endpoint: http://localhost:${port}/api/movies?query=batman`
);
console.log(
  `📺 Shows endpoint: http://localhost:${port}/api/tv?query=breaking+bad`
);
