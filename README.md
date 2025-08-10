# VidSrc Wrapper - TMDB Movie Search

A TypeScript movie search application using The Movie Database (TMDB) API.

**Stack:** Vue 3 + TypeScript frontend, Hono backend, shared types

## Setup

**Prerequisites:** Node.js 18+ and TMDB Read Access Token ([get one here](https://www.themoviedb.org/settings/api))

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file in root:**

   ```env
   TMDB_API_KEY=your_tmdb_read_access_token_here
   PORT=3001
   ```

3. **Build shared types:**
   ```bash
   npm run build:data
   ```

## Development

```bash
npm run dev
```

This starts:

- Backend at `http://localhost:3001`
- Frontend at `http://localhost:5173`

## Production

```bash
npm run build  # Build all packages
npm start      # Start production server
```

## Development Commands

```bash
npm run type-check    # TypeScript type checking
npm run prettier      # Format code
npm run lint          # Lint code
npm run lint:fix      # Auto-fix linting issues
```

## VS Code Setup

Included configuration:

- Format on save with Prettier
- ESLint auto-fix on save
- Vue and TypeScript support

**Recommended extensions:** Prettier, ESLint, Vue Language Features (Volar)

## Project Structure

```
packages/
├── data/     # Shared TypeScript types
├── server/   # Hono backend API
└── client/   # Vue frontend
```

## API

- `GET /api/movies?query=batman&page=1` - Search movies
- `GET /` - Health check

## Components

- **SearchForm** - Search input with loading states
- **MovieList** - Results grid with loading/empty states
- **MovieCard** - Movie poster, title, year, rating, overview

## Deployment

Deploy to any Node.js hosting. Set `TMDB_API_KEY` environment variable in your deployment environment.

## License

MIT
