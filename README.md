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

3. **Run**

   ```bash
   npm run dev
   ```

This starts:

- Backend at `http://localhost:8080`
- Frontend at `http://localhost:3000`
