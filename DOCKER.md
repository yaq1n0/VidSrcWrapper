# Docker

This application comes with docker build & docker run scripts which make it simple to build the image and deploy the container on your own local servers. (npm run dev is not a production deployment)

We serve the Vue client (3000) via nginx on :80 (standard web server), which proxies /api/\* to the Hono server in the same container at :8080

### Files

- `Dockerfile` (Node 22, multi-stage build)
- `nginx.conf` (serves SPA, proxies `/api/*`)
- `docker-entrypoint.sh` (starts API, then Nginx)

### Prerequisites

- Docker installed on the host
- TMDB Read Access Token (Bearer) // see README.md for where to get this.

### Getting started

- from the project root
- `npm run docker:build` will build the image
- you can then choose either
- `npm run docker:run:env` **(RECOMMENDED)** which reads from the .env file at the project root (which you might already have, if you're tried npm run dev earlier)
- `npm run docker:run` which requires you to manually export TMDB_API_KEY beforehand
