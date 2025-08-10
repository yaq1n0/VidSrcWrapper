import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory of the monorepo
config({ path: join(__dirname, '../../../.env') });

export type ServerConfig = {
  PORT: number;
  /**
   * TMDB API Key
   * This should be your TMDB Read Access Token (Bearer token), not the API key that's part of the query param
   * @see https://www.themoviedb.org/settings/api
   */
  TMDB_API_KEY: string;
  TMDB_BASE_URL: string;
  TMDB_IMAGE_BASE_URL: string;
};

export const CONFIG: ServerConfig = {
  PORT: parseInt(process.env.PORT || '3001'),
  TMDB_API_KEY: process.env.TMDB_API_KEY || '',
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
};

// Validate required environment variables
// During tests, avoid hard exiting to allow unit tests to mock network calls
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// if you don't have a TMDB_API_KEY and you aren't testing, then throw an error and exit.
if (!CONFIG.TMDB_API_KEY && !isTestEnv) {
  console.error('Error: TMDB_API_KEY environment variable is required');
  console.error(
    'Please set your TMDB Read Access Token (not API v3 key) in the .env file'
  );
  console.error('Get it from: https://www.themoviedb.org/settings/api');
  process.exit(1);
}
