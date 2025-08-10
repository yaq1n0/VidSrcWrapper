# VidSrc Wrapper - TMDB Movie Search

A TypeScript movie search application using The Movie Database (TMDB) API, which also happens hook into VidSrc.. and in theory any other _legal_ streaming service that uses IMDB/TMDB ids.

This isn't hosted anywhere, but it's made in such a way to make it very simple to run on your own servers.

**Stack:** Full-stack Typescript, Vue 3 + Vite client, Hono server

## Setup

**Prerequisites:** TMDB Read Access Token (Bearer auth) ([get one here](https://www.themoviedb.org/settings/api))

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file in root:**

   ```env
   TMDB_API_KEY=your_tmdb_read_access_token_here
   ```

3. **Build**

   ```bash
   npm run build
   ```

4. **Start**

   ```bash
   npm run start
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
