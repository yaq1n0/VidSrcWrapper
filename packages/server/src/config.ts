import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
config({ path: join(__dirname, '../../../.env') });

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001'),
  TMDB_API_KEY: process.env.TMDB_API_KEY || '', // This should be your TMDB Read Access Token (Bearer token)
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
} as const;

// Validate required environment variables
// During tests, avoid hard exiting to allow unit tests to mock network calls
const isTestEnv =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
if (!CONFIG.TMDB_API_KEY && !isTestEnv) {
  console.error('Error: TMDB_API_KEY environment variable is required');
  console.error(
    'Please set your TMDB Read Access Token (not API v3 key) in the .env file'
  );
  console.error('Get it from: https://www.themoviedb.org/settings/api');
  process.exit(1);
}
