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

- Backend at `http://localhost:8080`
- Frontend at `http://localhost:3000`

## Docker (production)

This repository includes a production-ready Docker setup that serves the Vue client via Nginx on port 80 and proxies `/api/*` requests to the Node/Hono server running inside the same container on `127.0.0.1:8080`.

### Files

- `Dockerfile` (Node 22, multi-stage build)
- `nginx.conf` (serves SPA, proxies `/api/*`)
- `docker-entrypoint.sh` (starts API, then Nginx)

### Prerequisites

- Docker installed on the host
- TMDB Read Access Token (Bearer) as `TMDB_API_KEY` (never bake it into the image)

### Build the image

```bash
npm run docker:build
```

### Run the container

Use this is you want to read from .env

```bash
npm run docker:run:env
```

Use this is you want to manually export TMDB_API_KEY beforehand (useful for production use cases)

```bash
npm run docker:run
```

### Domains and networking

- Point your domain’s A record to the host’s public IP
- Ensure host firewall allows inbound TCP 80
- If using a non-standard host port (e.g., `-p 8080:80`), include it in your URL

### HTTPS (recommended)

Terminate TLS at the host using a reverse proxy (simple options):

- Caddy (automatic Let’s Encrypt) → proxy to `127.0.0.1:80`
- Traefik (Docker-aware)
- Nginx with Certbot

This container intentionally serves HTTP only to keep it portable; TLS is best handled by the host or a load balancer.

### How it works

- Nginx serves the built SPA from `packages/client/dist`
- Requests to `/api/*` are proxied to the Node server on `127.0.0.1:8080`
- `TMDB_API_KEY` must be provided at runtime; it is not included in the image (obviously)

## Development Commands

```bash
npm run type-check    # TypeScript type checking
npm run prettier      # Format code
npm run lint          # Lint code
npm run lint:fix      # Auto-fix linting issues
```
