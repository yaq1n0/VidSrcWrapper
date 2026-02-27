import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory of the monorepo
config({ path: join(__dirname, '../../../.env') });

export type ServerConfig = {
  ENV: 'dev' | 'prod' | 'test';
  PORT: number;
  /**
   * TMDB API Key
   * This should be your TMDB Read Access Token (Bearer token), not the API key that's part of the query param
   * @see https://www.themoviedb.org/settings/api
   */
  TMDB_API_KEY: string;
  TMDB_BASE_URL: string;
  TMDB_IMAGE_BASE_URL: string;
  VIDSRC_BASE_URL: string;
};

let env: ServerConfig['ENV'] = 'prod';
if (process.env.ENV === 'test' || process.env.VITEST === 'true') env = 'test';
// if we implement a way to set dev, then we can add a conditional here

export const CONFIG: ServerConfig = {
  ENV: env,
  PORT: parseInt(process.env.PORT || '8080'),
  TMDB_API_KEY: process.env.TMDB_API_KEY || '',
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  VIDSRC_BASE_URL: 'https://vsrc.su', // this should match up with /client/src/config.ts's VIDSRC_BASE_URL or embeds will get rejected.
};

// if you don't have a TMDB_API_KEY and you aren't testing, then throw an error and exit.
if (!CONFIG.TMDB_API_KEY && CONFIG.ENV !== 'test') {
  console.error('Error: TMDB_API_KEY environment variable is required');
  console.error(
    'Please set your TMDB Read Access Token (not API v3 key) in the .env file'
  );
  console.error('Get it from: https://www.themoviedb.org/settings/api');
  process.exit(1);
}
